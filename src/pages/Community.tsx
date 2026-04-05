import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, MessageSquare, Plus, Send, User, LogOut, Beaker, FlaskConical, Pencil, X, Save, Trash2 } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
  model_id: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface ModelOption {
  id: string;
  title: string;
}

const CATEGORIES = [
  { value: 'general', key: 'community.categories.general' },
  { value: 'modeles', key: 'community.categories.modeles' },
  { value: 'experiences', key: 'community.categories.experiences' },
  { value: 'questions', key: 'community.categories.questions' },
  { value: 'ressources', key: 'community.categories.ressources' },
];

const Community = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { canManage } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [newModelId, setNewModelId] = useState<string>('');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  // Edit post
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('general');
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // Approved models for the selector
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  // Model names cache for display
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  // M:N links post↔modèle
  const [postModelLinks, setPostModelLinks] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchModels = async () => {
      const { data } = await supabase
        .from('models')
        .select('id, title')
        .eq('approved', true)
        .order('title');
      if (data) {
        setModelOptions(data as ModelOption[]);
        const names: Record<string, string> = {};
        (data as ModelOption[]).forEach(m => { names[m.id] = m.title; });
        setModelNames(names);
      }
    };
    const fetchLinks = async () => {
      const { data } = await supabase.from('post_model_links').select('post_id, model_id');
      if (data) {
        const map: Record<string, string[]> = {};
        data.forEach((link: any) => {
          if (!map[link.post_id]) map[link.post_id] = [];
          map[link.post_id].push(link.model_id);
        });
        setPostModelLinks(map);
      }
    };
    fetchModels();
    fetchLinks();
  }, []);

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
      toast.error(t('community.errorLoadingPosts'));
      setLoading(false);
      return;
    }
    const postsData = (data || []) as Post[];
    setPosts(postsData);

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

  useEffect(() => { fetchPosts(); }, [categoryFilter]);
  useEffect(() => { fetchLikedPosts(); }, [user]);

  // Auto-open form if coming from model feedback link
  useEffect(() => {
    if (searchParams.get('new') === '1' && user) {
      setShowForm(true);
      const title = searchParams.get('title');
      const modelId = searchParams.get('model');
      if (title) setNewTitle(decodeURIComponent(title));
      if (modelId) setNewModelId(modelId);
      setNewCategory('modeles');
      // Clean URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title || !content) {
      toast.error(t('community.titleContentRequired'));
      return;
    }

    const insertData: any = {
      user_id: user.id,
      title,
      content,
      category: newCategory,
    };
    if (newModelId) {
      insertData.model_id = newModelId;
    }

    const { error } = await supabase.from('forum_posts').insert(insertData);

    if (error) {
      toast.error(t('community.errorCreatingPost'));
      return;
    }

    setNewTitle('');
    setNewContent('');
    setNewCategory('general');
    setNewModelId('');
    setShowForm(false);
    toast.success(t('community.postPublished'));
    fetchPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user) { toast.error(t('community.loginToLike')); return; }
    if (likedPosts.has(postId)) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts((prev) => { const next = new Set(prev); next.delete(postId); return next; });
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
    if (expandedPost === postId) { setExpandedPost(null); return; }
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
    if (!user) { toast.error(t('community.loginToComment')); return; }
    const content = commentText.trim();
    if (!content) return;
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content });
    if (error) { toast.error(t('community.errorAddingComment')); return; }
    setCommentText('');
    const { data } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (data) {
      setComments((prev) => ({ ...prev, [postId]: data }));
      await fetchCommentProfiles(data);
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)));
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setEditPostCategory(post.category);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
  };

  const saveEditPost = async () => {
    if (!editingPostId) return;
    const trimmedTitle = editPostTitle.trim();
    const trimmedContent = editPostContent.trim();
    if (!trimmedTitle || !trimmedContent) {
      toast.error(t('community.titleContentRequired'));
      return;
    }
    setEditPostSaving(true);
    const { error } = await supabase.from('forum_posts').update({
      title: trimmedTitle,
      content: trimmedContent,
      category: editPostCategory,
    } as any).eq('id', editingPostId);
    setEditPostSaving(false);
    if (error) {
      toast.error(t('community.errorEditingPost'));
      console.error(error);
      return;
    }
    setPosts(prev => prev.map(p => p.id === editingPostId
      ? { ...p, title: trimmedTitle, content: trimmedContent, category: editPostCategory }
      : p
    ));
    setEditingPostId(null);
    toast.success(t('community.postEdited'));
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;
    const { error } = await supabase.from('forum_posts').delete().eq('id', deletePostId);
    if (error) {
      toast.error(t('community.errorDeletingPost'));
      console.error(error);
      setDeletePostId(null);
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== deletePostId));
    setDeletePostId(null);
    toast.success(t('community.postDeleted'));
  };

  const getProfile = (userId: string) => profiles[userId];
  const timeAgo = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: i18n.language?.startsWith('en') ? undefined : fr });

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Delete post confirmation modal */}
      {deletePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletePostId(null)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">{t('community.deletePostTitle')}</h3>
            <p className="mb-6 text-sm text-muted-foreground">{t('community.deletePostMessage')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletePostId(null)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t('common.cancel')}</button>
              <button onClick={handleDeletePost} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('community.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('community.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:brightness-110">
                <Plus className="h-4 w-4" /> {t('community.newPost')}
              </button>
              <button onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground">
              <User className="h-4 w-4" /> {t('community.loginToPost')}
            </Link>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setCategoryFilter('all')}
          className={`rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          {t('community.allCategories')}
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
            className={`rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${categoryFilter === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {t(cat.key)}
          </button>
        ))}
      </div>

      {/* New post form */}
      {showForm && user && (
        <form onSubmit={handleCreatePost} className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">{t('community.newPostTitle')}</h3>
          <div className="mb-3">
            <input type="text" placeholder={t('community.titlePlaceholder')} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" required />
          </div>
          <div className="mb-3">
            <textarea placeholder={t('community.contentPlaceholder')} value={newContent} onChange={(e) => setNewContent(e.target.value)}
              maxLength={5000} rows={4} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2" required />
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('community.category')}</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{t(cat.key)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('community.linkModel')}</label>
              <select value={newModelId} onChange={(e) => setNewModelId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">{t('community.noModel')}</option>
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              {t('common.cancel')}
            </button>
            <button type="submit"
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:brightness-110">
              {t('common.publish')}
            </button>
          </div>
        </form>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t('community.noPosts')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const profile = getProfile(post.user_id);
            // Collecter tous les modèles liés (legacy model_id + table M:N)
            const linkedModelIds = new Set<string>();
            if (post.model_id) linkedModelIds.add(post.model_id);
            (postModelLinks[post.id] || []).forEach(id => linkedModelIds.add(id));
            return (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <Link to={`/profil/${post.user_id}`} className="text-sm font-medium text-foreground hover:text-secondary">{profile?.display_name || t('common.anonymous')}</Link>
                    <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {[...linkedModelIds].map(modelId => modelNames[modelId] ? (
                      <Link key={modelId} to={`/model/${modelId}`}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary hover:bg-secondary/20 transition-colors">
                        <Beaker className="h-3 w-3" /> {modelNames[modelId]}
                      </Link>
                    ) : null)}
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {(() => { const cat = CATEGORIES.find((c) => c.value === post.category); return cat ? t(cat.key) : post.category; })()}
                    </span>
                  </div>
                </div>

                {editingPostId === post.id ? (
                  <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div>
                      <input type="text" value={editPostTitle} onChange={e => setEditPostTitle(e.target.value)}
                        maxLength={200} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold outline-none ring-ring focus:ring-2" />
                    </div>
                    <textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)}
                      maxLength={5000} rows={4}
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
                    <div className="flex items-center gap-3">
                      <select value={editPostCategory} onChange={e => setEditPostCategory(e.target.value)}
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{t(cat.key)}</option>
                        ))}
                      </select>
                      <div className="ml-auto flex gap-2">
                        <button onClick={cancelEditPost}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" /> {t('common.cancel')}
                        </button>
                        <button onClick={saveEditPost} disabled={editPostSaving}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground disabled:opacity-50">
                          <Save className="h-3.5 w-3.5" /> {editPostSaving ? t('common.saving') : t('common.save')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">{post.title}</h3>
                      {user && (user.id === post.user_id || canManage) && (
                        <>
                          <button onClick={() => startEditPost(post)}
                            className="rounded p-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                            title={t('common.edit')}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletePostId(post.id)}
                            className="rounded p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                            title={t('common.delete')}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="mb-4 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                  </>
                )}

                <div className="flex items-center gap-4 border-t border-border pt-3">
                  <button onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${likedPosts.has(post.id) ? 'font-medium text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    {post.likes_count}
                  </button>
                  <button onClick={() => loadComments(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${expandedPost === post.id ? 'font-medium text-secondary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <MessageSquare className="h-4 w-4" />
                    {post.comments_count} {post.comments_count !== 1 ? t('community.comments') : t('community.comment')}
                  </button>
                  {canManage && (
                    <Link
                      to={`/contribute?from_post=${post.id}&title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.content)}`}
                      className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <FlaskConical className="h-4 w-4" />
                      {t('community.proposeAsModel')}
                    </Link>
                  )}
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
                              <span className="text-sm font-medium text-foreground">{cProfile?.display_name || t('common.anonymous')}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    {user && (
                      <div className="flex gap-2 pt-2">
                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          placeholder={t('community.addComment')} maxLength={1000}
                          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
                        <button onClick={() => handleComment(post.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:brightness-110">
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
