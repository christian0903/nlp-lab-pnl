import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Shield, User as UserIcon, Trash2, KeyRound, Plus, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserRow {
  user_id: string;
  display_name: string;
  created_at: string;
  bio: string | null;
}

interface RoleRow {
  user_id: string;
  role: string;
}

type AppRole = 'user' | 'moderator' | 'admin';

const ROLE_LABELS: Record<AppRole, string> = {
  user: 'Utilisateur',
  moderator: 'Modérateur',
  admin: 'Administrateur',
};

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [profiles, setProfiles] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit display name
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      const [profsRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, created_at, bio').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      setProfiles((profsRes.data || []) as UserRow[]);
      setRoles((rolesRes.data || []) as RoleRow[]);
      setLoading(false);
    };
    fetchAll();
  }, [isAdmin]);

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!user || !isAdmin) return <Navigate to="/admin" replace />;

  const getUserRole = (userId: string): AppRole => {
    const userRoles = roles.filter(r => r.user_id === userId);
    if (userRoles.some(r => r.role === 'admin')) return 'admin';
    if (userRoles.some(r => r.role === 'moderator')) return 'moderator';
    return 'user';
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (userId === user.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }

    // Remove existing roles for this user
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Add new role if not 'user' (default)
    if (newRole !== 'user') {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole } as any);
      if (error) { toast.error('Erreur'); return; }
    }

    setRoles(prev => {
      const filtered = prev.filter(r => r.user_id !== userId);
      if (newRole !== 'user') filtered.push({ user_id: userId, role: newRole });
      return filtered;
    });
    toast.success(`Rôle changé en "${ROLE_LABELS[newRole]}"`);
  };

  const handleResetPassword = async (email: string, displayName: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error('Erreur lors de l\'envoi');
      console.error(error);
      return;
    }
    toast.success(`Email de réinitialisation envoyé à ${displayName}`);
  };

  const handleDeleteUser = async (userId: string) => {
    // Delete roles
    await supabase.from('user_roles').delete().eq('user_id', userId);
    // Delete profile
    const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return;
    }
    setProfiles(prev => prev.filter(p => p.user_id !== userId));
    setRoles(prev => prev.filter(r => r.user_id !== userId));
    setDeleteUserId(null);
    toast.success('Profil utilisateur supprimé');
  };

  const handleAddUser = async () => {
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) {
      toast.error('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setAddSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: newEmail.trim(),
      password: newPassword,
      options: {
        data: { display_name: newName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setAddSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Compte créé pour ${newName.trim()}. Un email de confirmation a été envoyé.`);
    setNewEmail(''); setNewName(''); setNewPassword(''); setShowAddForm(false);
    // Refresh profiles
    const { data } = await supabase.from('profiles').select('user_id, display_name, created_at, bio').order('created_at', { ascending: false });
    if (data) setProfiles(data as UserRow[]);
  };

  const handleSaveName = async (userId: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) { toast.error('Le nom ne peut pas être vide'); return; }
    const { error } = await supabase.from('profiles').update({ display_name: trimmed } as any).eq('user_id', userId);
    if (error) { toast.error('Erreur'); return; }
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, display_name: trimmed } : p));
    setEditingNameId(null);
    toast.success('Nom mis à jour');
  };

  // We need emails — they're not in profiles. We'll show user_id and display_name.
  // For reset password we need the email. Let's note this limitation.

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Administration
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{profiles.length} utilisateur(s) inscrit(s)</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:brightness-110 transition-all">
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? 'Annuler' : 'Ajouter un utilisateur'}
        </button>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-display text-sm font-semibold text-foreground">Nouveau compte utilisateur</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Nom d'affichage *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Jean Dupont" maxLength={100}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Email *</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Mot de passe * (min 6 car.)</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Mot de passe initial"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAddUser} disabled={addSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {addSubmitting ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteUserId(null)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Supprimer cet utilisateur ?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Le profil de <strong>"{deleteUserName}"</strong> sera supprimé, ainsi que ses rôles. Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteUserId(null)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Annuler
              </button>
              <button onClick={() => handleDeleteUser(deleteUserId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Chargement...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const currentRole = getUserRole(p.user_id);
                const isSelf = p.user_id === user.id;
                return (
                  <tr key={p.user_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {p.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          {editingNameId === p.user_id ? (
                            <div className="flex items-center gap-1">
                              <input type="text" value={editingNameValue} onChange={e => setEditingNameValue(e.target.value)}
                                maxLength={100} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(p.user_id); if (e.key === 'Escape') setEditingNameId(null); }}
                                className="w-40 rounded border border-input bg-background px-2 py-0.5 text-sm outline-none ring-ring focus:ring-2" />
                              <button onClick={() => handleSaveName(p.user_id)} className="rounded p-0.5 text-secondary hover:bg-secondary/10">
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingNameId(null)} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium text-foreground cursor-pointer hover:text-secondary"
                              onClick={() => { if (!isSelf) { setEditingNameId(p.user_id); setEditingNameValue(p.display_name); } }}
                              title={isSelf ? undefined : 'Cliquer pour modifier le nom'}>
                              {p.display_name}
                            </span>
                          )}
                          {isSelf && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Vous</span>}
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{p.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <RoleBadge role={currentRole} />
                      ) : (
                        <select value={currentRole} onChange={e => handleRoleChange(p.user_id, e.target.value as AppRole)}
                          className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium outline-none ring-ring focus:ring-2">
                          <option value="user">Utilisateur</option>
                          <option value="moderator">Modérateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!isSelf && (
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => {
                            const email = prompt(`Email de ${p.display_name} pour envoyer le lien de réinitialisation :`);
                            if (email) handleResetPassword(email, p.display_name);
                          }}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            title="Réinitialiser le mot de passe">
                            <KeyRound className="h-3 w-3" /> Reset mdp
                          </button>
                          <button onClick={() => { setDeleteUserId(p.user_id); setDeleteUserName(p.display_name); }}
                            className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Supprimer l'utilisateur">
                            <Trash2 className="h-3 w-3" /> Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const RoleBadge = ({ role }: { role: AppRole }) => {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
      <ShieldCheck className="h-3 w-3" /> Admin
    </span>
  );
  if (role === 'moderator') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
      <Shield className="h-3 w-3" /> Modérateur
    </span>
  );
  return <span className="text-xs text-muted-foreground">Utilisateur</span>;
};

export default AdminUsers;
