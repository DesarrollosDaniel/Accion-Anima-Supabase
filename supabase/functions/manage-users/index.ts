import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

type StaffRole = "veterinarian" | "reception"

interface InviteRequest {
  email?: unknown
  displayName?: unknown
  role?: unknown
}

interface DeleteRequest {
  userId?: unknown
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST" && req.method !== "DELETE") {
      return errorResponse("Método no permitido.", 405)
    }

    const callerId = ctx.userClaims?.id
    if (!callerId) {
      return errorResponse("La sesión no es válida.", 401)
    }

    const { data: caller, error: callerError } = await ctx.supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerId)
      .single()

    if (callerError || !caller || !caller.is_active || caller.role !== "owner") {
      return errorResponse("Solo el usuario dueño puede administrar usuarios.", 403)
    }

    let input: InviteRequest | DeleteRequest
    try {
      input = await req.json()
    } catch {
      return errorResponse("La solicitud no contiene datos válidos.", 400)
    }

    if (req.method === "DELETE") {
      const deleteInput = input as DeleteRequest
      const userId = typeof deleteInput.userId === "string" ? deleteInput.userId.trim() : ""
      if (!uuidPattern.test(userId)) {
        return errorResponse("El usuario indicado no es válido.", 400)
      }
      if (userId === callerId) {
        return errorResponse("El usuario dueño no puede eliminar su propia cuenta.", 400)
      }

      const { data: target, error: targetError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (targetError || !target) {
        return errorResponse("El usuario ya no existe.", 404)
      }
      if (target.role === "owner") {
        return errorResponse("La cuenta del dueño no se puede eliminar.", 400)
      }

      const { error: prepareError } = await ctx.supabase
        .rpc("prepare_auth_user_deletion", { target_user_id: userId })

      if (prepareError) {
        console.error("Could not prepare Auth user deletion", prepareError)
        return errorResponse("No fue posible preparar la eliminación sin perder archivos.", 500)
      }

      const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId, false)
      if (deleteError) {
        console.error("Could not delete Auth user", deleteError)
        return errorResponse("No fue posible eliminar el usuario. Intenta de nuevo.", 500)
      }

      const { error: auditError } = await ctx.supabaseAdmin.from("audit_events").insert({
        actor_id: callerId,
        action: "DELETE",
        entity_table: "profiles",
        entity_id: userId,
      })
      if (auditError) console.error("Could not record Auth user deletion", auditError)

      return Response.json({
        message: "Usuario eliminado. Su actividad y sus archivos se conservaron.",
      })
    }

    const inviteInput = input as InviteRequest
    const email = typeof inviteInput.email === "string" ? inviteInput.email.trim().toLowerCase() : ""
    const displayName = typeof inviteInput.displayName === "string" ? inviteInput.displayName.trim() : ""
    const role = inviteInput.role as StaffRole

    if (!emailPattern.test(email) || email.length > 254) {
      return errorResponse("Escribe un correo electrónico válido.", 400)
    }
    if (displayName.length < 2 || displayName.length > 120) {
      return errorResponse("El nombre debe tener entre 2 y 120 caracteres.", 400)
    }
    if (role !== "veterinarian" && role !== "reception") {
      return errorResponse("Selecciona un rol permitido.", 400)
    }

    const appUrl = Deno.env.get("APP_URL") ?? "http://127.0.0.1:5173/"
    const redirectUrl = new URL(appUrl)
    redirectUrl.searchParams.set("invite", "1")

    const { data: invitation, error: inviteError } = await ctx.supabaseAdmin.auth.admin
      .inviteUserByEmail(email, {
        data: { display_name: displayName },
        redirectTo: redirectUrl.toString(),
      })

    if (inviteError || !invitation.user) {
      const duplicate = inviteError?.message.toLowerCase().includes("already")
      return errorResponse(
        duplicate ? "Ya existe una cuenta con ese correo." : "No fue posible enviar la invitación. Intenta de nuevo.",
        duplicate ? 409 : 400,
      )
    }

    const { error: profileError } = await ctx.supabaseAdmin
      .from("profiles")
      .update({ display_name: displayName, role })
      .eq("id", invitation.user.id)

    if (profileError) {
      console.error("Invitation created but profile update failed", profileError)
      return errorResponse("La invitación se creó, pero no fue posible asignar el rol. Contacta al administrador.", 500)
    }

    return Response.json({
      message: "Invitación enviada.",
      user: {
        id: invitation.user.id,
        email,
        displayName,
        role,
      },
    })
  }),
}
