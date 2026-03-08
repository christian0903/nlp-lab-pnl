import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Plus, Send, User, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Profile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

const CATEGORIES = [
  { value: 'general', label: '💬 Général' },
  { value: 'modeles', label: '🔬 Modèles' },
  { value: 'experiences', label: '🧪 Expériences' },
  { value: 'questions', label: '❓ Questions' },
  { value: 'ressources', label: '📚 Ressources' },
];

const Community = () => {
  const { user, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  const fetchPosts = async () => {
    const query = supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoryFilter !== 'all') {
      query.eq('category', categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Erreur chargement des posts');
      setLoading(false);
      return;
    }
    const postsData = data || [];
    setPosts(postsData);

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      if (profilesData) {
        const map: Record<string, Profile> = {};
        profilesData.forEach((p) => { map[p.user_id] = p; });
        setProfiles((prev) => ({ ...prev, ...map }));
      }
    }
    setLoading(false);
  };

  const fetchLikedPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (data) {
      setLikedPosts(new Set(data.map((l) => l.post_id)));
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [categoryFilter]);

  useEffect(() => {
    fetchLikedPosts();
  }, [user]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title || !content) {
      toast.error('Titre et contenu requis');
      return;
    }

    const { error } = await supabase.from('forum_posts').insert({
      user_id: user.id,
      title,
      content,
      category: newCategory,
    });

    if (error) {
      toast.error('Erreur création du post');
      return;
    }

    setNewTitle('');
    setNewContent('');
    setNewCategory('general');
    setShowForm(false);
    toast.success('Post publié !');
    fetchPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Connectez-vous pour liker');
      return;
    }

    if (likedPosts.has(postId)) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p)));
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)));
    }
  };

  const fetchCommentProfiles = async (commentsData: Comment[]) => {
    const userIds = [...new Set(commentsData.map((c) => c.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      if (profilesData) {
        const map: Record<string, Profile> = {};
        profilesData.forEach((p) => { map[p.user_id] = p; });
        setProfiles((prev) => ({ ...prev, ...map }));
      }
    }
  };

  const loadComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);

    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments((prev) => ({ ...prev, [postId]: data }));
      await fetchCommentProfiles(data);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      toast.error('Connectez-vous pour commenter');
      return;
    }
    const content = commentText.trim();
    if (!content) return;

    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
    });

    if (error) {
      toast.error('Erreur ajout commentaire');
      return;
    }

    setCommentText('');
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments((prev) => ({ ...prev, [postId]: data }));
      await fetchCommentProfiles(data);
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
  };

  const getProfile = (userId: string) => profiles[userId];

  const timeAgo = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Communauté</h1>
          <p className="mt-1 text-muted-foreground">Échangez avec les praticiens et chercheurs PNL</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Nouveau post
              </button>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              <User className="h-4 w-4" /> Se connecter
            </Link>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Tous
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* New post form */}
      {showForm && user && (
        <form onSubmit={handleCreatePost} className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Nouveau post</h3>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Titre"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              required
            />
          </div>
          <div className="mb-3">
            <textarea
              placeholder="Partagez vos réflexions, questions ou découvertes..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:brightness-110"
              >
                Publier
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Chargement...</div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun post pour le moment. Soyez le premier à publier !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const profile = getProfile(post.user_id);
            return (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile?.display_name || 'Anonyme'}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                  </span>
                </div>

                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{post.title}</h3>
                <p className="mb-4 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{post.content}</p>

                <div className="flex items-center gap-4 border-t border-border pt-3">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      likedPosts.has(post.id)
                        ? 'font-medium text-destructive'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    {post.likes_count}
                  </button>
                  <button
                    onClick={() => loadComments(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      expandedPost === post.id
                        ? 'font-medium text-secondary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {post.comments_count} commentaire{post.comments_count !== 1 ? 's' : ''}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    {(comments[post.id] || []).map((comment) => {
                      const cProfile = getProfile(comment.user_id);
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {cProfile?.display_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-foreground">{cProfile?.display_name || 'Anonyme'}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}

                    {user && (
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          placeholder="Ajouter un commentaire..."
                          maxLength={1000}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:brightness-110"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Community;
