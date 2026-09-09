import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

type StaffRole = "veterinarian" | "reception"

interface InviteRequest {
  email?: unknown
  displayName?: unknown
  role?: unknown
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
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
      return errorResponse("Solo el usuario dueño puede invitar usuarios.", 403)
    }

    let input: InviteRequest
    try {
      input = await req.json()
    } catch {
      return errorResponse("La solicitud no contiene datos válidos.", 400)
    }

    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : ""
    const displayName = typeof input.displayName === "string" ? input.displayName.trim() : ""
    const role = input.role as StaffRole

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
