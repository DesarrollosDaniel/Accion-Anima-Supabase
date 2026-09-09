import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ChevronRight,
  CircleUserRound,
  ClipboardPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabase'

type Role = 'owner' | 'veterinarian' | 'reception'
type View = 'dashboard' | 'pets' | 'users'

interface Profile {
  id: string
  display_name: string
  role: Role
  is_active: boolean
  created_at: string
}

interface Pet {
  id: string
  name: string
  species: string | null
  breed: string | null
  sex: 'male' | 'female' | 'unknown' | null
  status: 'active' | 'inactive' | 'deceased'
  photo_path: string | null
  guardian_name: string
  guardian_phone: string | null
  created_at: string
}

const roleLabels: Record<Role, string> = {
  owner: 'Dueño',
  veterinarian: 'Veterinario',
  reception: 'Recepción',
}

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard; ownerOnly?: boolean }> = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'pets', label: 'Mascotas', icon: PawPrint },
  { id: 'users', label: 'Usuarios', icon: ShieldCheck, ownerOnly: true },
]

function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError('No fue posible iniciar sesión. Revisa tu correo y contraseña.')
    setLoading(false)
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Acción Animal">
        <div className="login-brand-inner">
          <img src="./logo.jpg" alt="Logotipo de Acción Animal" className="login-logo" />
          <p className="eyebrow light">Sistema clínico veterinario</p>
          <h1>Cuidamos cada historia con orden y claridad.</h1>
          <p className="login-copy">
            Expedientes de mascotas y seguimiento clínico en un solo espacio seguro para el equipo.
          </p>
          <div className="brand-feature"><Stethoscope size={20} /> Información clínica centralizada</div>
          <div className="brand-feature"><ShieldCheck size={20} /> Acceso protegido por perfiles</div>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-logo"><img src="./logo.jpg" alt="Acción Animal" /></div>
          <p className="eyebrow">Bienvenido</p>
          <h2>Inicia sesión</h2>
          <p className="muted">Usa la cuenta proporcionada por el administrador.</p>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="nombre@correo.com"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••"
              required
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary full" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
            {!loading && <ChevronRight size={18} />}
          </button>
          <p className="login-help">¿Problemas para acceder? Contacta al usuario dueño.</p>
        </form>
      </section>
    </main>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof PawPrint; title: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={25} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

function PetForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const payload = {
      name: String(data.get('name') || '').trim(),
      guardian_name: String(data.get('guardian_name') || '').trim(),
      guardian_phone: String(data.get('guardian_phone') || '').trim() || null,
      species: String(data.get('species') || '').trim() || null,
      breed: String(data.get('breed') || '').trim() || null,
      sex: String(data.get('sex') || 'unknown'),
      color_markings: String(data.get('color_markings') || '').trim() || null,
      birth_date: String(data.get('birth_date') || '') || null,
    }
    const { error: insertError } = await supabase.from('pets').insert(payload)
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    await onSaved()
    onClose()
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>Nombre de la mascota<input name="name" required maxLength={200} autoFocus /></label>
      <label>Especie<input name="species" maxLength={100} placeholder="Perro, gato…" /></label>
      <label>Raza<input name="breed" maxLength={120} /></label>
      <label>Sexo
        <select name="sex" defaultValue="unknown">
          <option value="unknown">Sin especificar</option>
          <option value="female">Hembra</option>
          <option value="male">Macho</option>
        </select>
      </label>
      <label>Fecha de nacimiento<input name="birth_date" type="date" /></label>
      <label>Color y señas<input name="color_markings" /></label>
      <div className="form-section-title span-2"><span>Tutor de esta mascota</span><small>Los datos pueden repetirse en otras mascotas.</small></div>
      <label>Nombre del tutor<input name="guardian_name" required maxLength={200} /></label>
      <label>Teléfono del tutor<input name="guardian_phone" type="tel" maxLength={40} /></label>
      {error && <p className="form-error span-2">{error}</p>}
      <div className="form-actions span-2">
        <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar mascota'}</button>
      </div>
    </form>
  )
}

async function functionErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context
    try {
      const body = await context?.clone().json() as { error?: string }
      if (body?.error) return body.error
    } catch {
      // The fallback below is intentionally user-friendly when the response has no JSON body.
    }
  }
  return 'No fue posible enviar la invitación. Intenta de nuevo.'
}

function InviteUserForm({ onClose, onInvited }: { onClose: () => void; onInvited: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const { error: invokeError } = await supabase.functions.invoke('manage-users', {
      body: {
        displayName: String(data.get('display_name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        role: String(data.get('role') || ''),
      },
    })

    if (invokeError) {
      setError(await functionErrorMessage(invokeError))
      setSaving(false)
      return
    }

    await onInvited()
    onClose()
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <p className="form-intro span-2">La persona recibirá un correo para activar su cuenta y crear su contraseña.</p>
      <label className="span-2">Nombre completo<input name="display_name" required minLength={2} maxLength={120} autoFocus /></label>
      <label className="span-2">Correo electrónico<input name="email" type="email" required maxLength={254} autoComplete="off" placeholder="nombre@correo.com" /></label>
      <label className="span-2">Rol
        <select name="role" defaultValue="reception" required>
          <option value="reception">Recepción</option>
          <option value="veterinarian">Veterinario</option>
        </select>
      </label>
      <p className="form-note span-2"><ShieldCheck size={17} /> Por seguridad, desde aquí no se puede crear otro usuario dueño.</p>
      {error && <p className="form-error span-2" role="alert">{error}</p>}
      <div className="form-actions span-2">
        <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? 'Enviando…' : 'Enviar invitación'}</button>
      </div>
    </form>
  )
}

function SetPassword() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') || '')
    const confirmation = String(data.get('confirmation') || '')

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      setSaving(false)
      return
    }
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Usa al menos 10 caracteres, una mayúscula, una minúscula y un número.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('No fue posible guardar la contraseña. Solicita una invitación nueva.')
      setSaving(false)
      return
    }

    window.history.replaceState({}, '', window.location.pathname)
    window.location.reload()
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Acción Animal">
        <div className="login-brand-inner">
          <img src="./logo.jpg" alt="Logotipo de Acción Animal" className="login-logo" />
          <p className="eyebrow light">Invitación aceptada</p>
          <h1>Tu acceso está casi listo.</h1>
          <p className="login-copy">Crea una contraseña segura para entrar al sistema de Acción Animal.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-logo"><img src="./logo.jpg" alt="Acción Animal" /></div>
          <p className="eyebrow">Activar cuenta</p>
          <h2>Crea tu contraseña</h2>
          <p className="muted">Debe incluir 10 caracteres, mayúscula, minúscula y número.</p>
          <label>Nueva contraseña<input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
          <label>Confirmar contraseña<input name="confirmation" type="password" minLength={10} autoComplete="new-password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary full" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar y continuar'}<ChevronRight size={18} /></button>
        </form>
      </section>
    </main>
  )
}

function Workspace({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [modal, setModal] = useState<'pet' | 'invite' | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const [profileResult, profilesResult, petsResult] = await Promise.all([
      supabase.from('profiles').select('id, display_name, role, is_active, created_at').eq('id', session.user.id).single(),
      supabase.from('profiles').select('id, display_name, role, is_active, created_at').order('created_at', { ascending: true }),
      supabase.from('pets').select('id, name, species, breed, sex, status, photo_path, guardian_name, guardian_phone, created_at').order('created_at', { ascending: false }).limit(500),
    ])

    const firstError = profileResult.error || profilesResult.error || petsResult.error
    if (firstError) setError(firstError.message)
    if (profileResult.data) setProfile(profileResult.data as Profile)
    if (profilesResult.data) setProfiles(profilesResult.data as Profile[])
    if (petsResult.data) setPets(petsResult.data as Pet[])
    setLoading(false)
  }, [session.user.id])

  useEffect(() => { void loadData() }, [loadData])

  const filteredPets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    if (!term) return pets
    return pets.filter((pet) => [pet.name, pet.species, pet.breed, pet.guardian_name, pet.guardian_phone].some((value) => value?.toLocaleLowerCase('es').includes(term)))
  }, [pets, search])

  const openView = (nextView: View) => {
    setView(nextView)
    setSearch('')
    setMobileNav(false)
  }

  const todayLabel = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  if (loading && !profile) return <div className="app-loader"><span className="loader" /><p>Cargando espacio de trabajo…</p></div>

  if (!profile || !profile.is_active) {
    return <div className="app-loader"><p className="form-error">Tu perfil no está disponible o se encuentra desactivado.</p><button className="button secondary" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div>
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="./logo.jpg" alt="Acción Animal" />
          <div><strong>Acción Animal</strong><span>Gestión clínica</span></div>
        </div>
        <nav aria-label="Navegación principal">
          <p className="nav-caption">MENÚ</p>
          {navItems.filter((item) => !item.ownerOnly || profile.role === 'owner').map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => openView(item.id)}>
                <Icon size={19} /><span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-profile">
          <span className="avatar">{initials(profile.display_name)}</span>
          <div><strong>{profile.display_name}</strong><span>{roleLabels[profile.role]}</span></div>
          <button className="icon-button dark" onClick={() => supabase.auth.signOut()} aria-label="Cerrar sesión"><LogOut size={18} /></button>
        </div>
      </aside>
      {mobileNav && <button className="nav-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileNav(true)} aria-label="Abrir menú"><Menu /></button>
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>{navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-user"><CircleUserRound size={20} /><span>{roleLabels[profile.role]}</span></div>
        </header>

        <div className="content">
          {error && <div className="alert error"><strong>No se pudo cargar toda la información.</strong><span>{error}</span></div>}
          {notice && <div className="alert success" role="status"><ShieldCheck size={18} /><span>{notice}</span></div>}

          {view === 'dashboard' && (
            <>
              <section className="welcome-card">
                <div><p className="eyebrow light">Panel principal</p><h2>Hola, {profile.display_name.split(' ')[0]}</h2><p>Aquí tienes una vista rápida de la actividad clínica.</p></div>
                <PawPrint size={74} aria-hidden="true" />
              </section>
              <section className="stat-grid">
                <button className="stat-card" onClick={() => openView('pets')}><span className="stat-icon green"><PawPrint /></span><div><strong>{pets.filter((pet) => pet.status === 'active').length}</strong><span>Mascotas activas</span></div><ChevronRight /></button>
                <button className="stat-card" onClick={() => openView('pets')}><span className="stat-icon blue"><ClipboardPlus /></span><div><strong>{pets.length}</strong><span>Total de expedientes</span></div><ChevronRight /></button>
                <button className="stat-card" onClick={() => openView('pets')}><span className="stat-icon amber"><PawPrint /></span><div><strong>{pets.filter((pet) => pet.status !== 'active').length}</strong><span>Mascotas inactivas</span></div><ChevronRight /></button>
              </section>
              <section className="dashboard-grid">
                <article className="panel">
                  <div className="panel-header"><div><p className="eyebrow">Actividad reciente</p><h2>Mascotas registradas</h2></div><button className="text-button" onClick={() => openView('pets')}>Ver todas</button></div>
                  {pets.length === 0 ? <EmptyState icon={PawPrint} title="Aún no hay mascotas" text="Crea el primer expediente para comenzar." /> : (
                    <div className="compact-list">{pets.slice(0, 8).map((pet) => <div className="compact-row" key={pet.id}><span className="pet-avatar"><PawPrint size={18} /></span><div><strong>{pet.name}</strong><span>{pet.species || 'Especie no indicada'} · Tutor: {pet.guardian_name}</span></div><span className={`status ${pet.status}`}>{pet.status === 'active' ? 'Activo' : pet.status === 'inactive' ? 'Inactivo' : 'Fallecido'}</span></div>)}</div>
                  )}
                </article>
              </section>
            </>
          )}

          {view === 'pets' && (
            <section className="panel page-panel">
              <div className="page-actions"><div><p className="eyebrow">Expedientes</p><h2>Mascotas</h2><p className="muted">La información del tutor se guarda dentro de cada mascota.</p></div><button className="button primary" onClick={() => setModal('pet')}><Plus size={18} /> Nueva mascota</button></div>
              <div className="search-box"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por mascota, especie, raza, tutor o teléfono" /></div>
              {filteredPets.length === 0 ? <EmptyState icon={PawPrint} title="Sin resultados" text={search ? 'Prueba con otro término de búsqueda.' : 'Todavía no hay mascotas registradas.'} /> : (
                <div className="table-wrap"><table><thead><tr><th>Mascota</th><th>Tutor</th><th>Teléfono</th><th>Especie / raza</th><th>Estado</th><th>Registro</th></tr></thead><tbody>{filteredPets.map((pet) => <tr key={pet.id}><td><div className="name-cell"><span className="pet-avatar"><PawPrint size={17} /></span><strong>{pet.name}</strong></div></td><td>{pet.guardian_name}</td><td>{pet.guardian_phone || '—'}</td><td>{[pet.species, pet.breed].filter(Boolean).join(' · ') || '—'}</td><td><span className={`status ${pet.status}`}>{pet.status === 'active' ? 'Activo' : pet.status === 'inactive' ? 'Inactivo' : 'Fallecido'}</span></td><td>{formatDate(pet.created_at)}</td></tr>)}</tbody></table></div>
              )}
            </section>
          )}

          {view === 'users' && profile.role === 'owner' && (
            <section className="panel page-panel">
              <div className="page-actions"><div><p className="eyebrow">Administración</p><h2>Usuarios y roles</h2><p className="muted">Solo el dueño puede invitar personas al sistema.</p></div><button className="button primary" onClick={() => { setNotice(''); setModal('invite') }}><Plus size={18} /> Invitar usuario</button></div>
              <div className="alert"><ShieldCheck size={18} /><span>Las invitaciones son privadas y permiten asignar únicamente los roles Veterinario o Recepción.</span></div>
              <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Registro</th></tr></thead><tbody>{profiles.map((user) => <tr key={user.id}><td><div className="name-cell"><span className="avatar table-avatar">{initials(user.display_name)}</span><strong>{user.display_name}</strong></div></td><td>{roleLabels[user.role]}</td><td><span className={`status ${user.is_active ? 'active' : 'inactive'}`}>{user.is_active ? 'Activo' : 'Inactivo'}</span></td><td>{formatDate(user.created_at)}</td></tr>)}</tbody></table></div>
            </section>
          )}
        </div>
      </main>

      {modal === 'pet' && <Modal title="Registrar mascota" onClose={() => setModal(null)}><PetForm onClose={() => setModal(null)} onSaved={loadData} /></Modal>}
      {modal === 'invite' && <Modal title="Invitar usuario" onClose={() => setModal(null)}><InviteUserForm onClose={() => setModal(null)} onInvited={async () => { await loadData(); setNotice('Invitación enviada. La persona debe revisar su correo para crear su contraseña.') }} /></Modal>}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="app-loader"><span className="loader" /><p>Preparando acceso seguro…</p></div>
  const acceptingInvite = new URLSearchParams(window.location.search).get('invite') === '1'
  if (session && acceptingInvite) return <SetPassword />
  return session ? <Workspace session={session} /> : <Login />
}
