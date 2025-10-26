import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Prüft, ob Request von Admin kommt
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ""
    const token = authHeader.replace("Bearer ", "")
    if (!token) return res.status(401).json({ error: "Kein Token" })

    const anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // erlaubt Admin-Prüfung über Auth
    )

    const { data, error } = await anonClient.auth.getUser(token)
    if (error || !data?.user)
      return res.status(403).json({ error: "Ungültiger Token" })

    const role = data.user.user_metadata?.role
    if (role !== "admin")
      return res.status(403).json({ error: "Kein Adminrecht" })

    req.user = data.user
    next()
  } catch (err) {
    console.error("Admincheck Fehler:", err.message)
    res.status(500).json({ error: "Interner Fehler" })
  }
}

// Hauptroute für Mitgliederverwaltung
app.post("/api/members", requireAdmin, async (req, res) => {
  const { action, userId, newRole } = req.body
  try {
    if (action === "list") {
      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      return res.json({
        users: data.users.map(u => ({
          id: u.id,
          email: u.email,
          role: u.user_metadata?.role || "applicant",
          banned: !!u.banned_until
        }))
      })
    }

    if (action === "setRole") {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      })
      if (error) throw error
      return res.json({ user: data.user })
    }

    if (action === "block") {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        banned_until: "9999-12-31T23:59:59Z"
      })
      if (error) throw error
      return res.json({ user: data.user })
    }

    if (action === "unblock") {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        banned_until: null
      })
      if (error) throw error
      return res.json({ user: data.user })
    }

    if (action === "delete") {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      return res.json({ success: true })
    }

    return res.status(400).json({ error: "Unbekannte Aktion" })
  } catch (err) {
    console.error("Admin API Fehler:", err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5050
app.listen(PORT, () => console.log(`✅ Admin API läuft auf Port ${PORT}`))