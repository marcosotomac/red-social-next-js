import { createClient } from "@/lib/supabase/client";

export interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  author: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  user_has_bookmarked?: boolean;
}

/**
 * Update a post's content
 */
export async function updatePost(
  postId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Check if user owns the post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError) {
      return { success: false, error: "Post no encontrado" };
    }

    if (post.author_id !== user.id) {
      return {
        success: false,
        error: "No tienes permisos para editar este post",
      };
    }

    // Validate content
    if (!content.trim() || content.length > 500) {
      return {
        success: false,
        error: "El contenido debe tener entre 1 y 500 caracteres",
      };
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      return { success: false, error: "Error al actualizar el post" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Delete a post and all related data
 */
export async function deletePost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Check if user owns the post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError) {
      return { success: false, error: "Post no encontrado" };
    }

    if (post.author_id !== user.id) {
      return {
        success: false,
        error: "No tienes permisos para eliminar este post",
      };
    }

    // Delete the post (cascade delete will handle related data)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      return { success: false, error: "Error al eliminar el post" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Check if current user can edit/delete a post
 */
export async function canUserEditPost(postId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    return post?.author_id === user.id;
  } catch {
    return false;
  }
}

/**
 * Create a new post with optional location
 */
export async function createPost(
  content: string,
  imageUrl?: string,
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }
): Promise<{ success: boolean; error?: string; post?: Post }> {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Validate content
    if (!content.trim() || content.length > 500) {
      return {
        success: false,
        error: "El contenido debe tener entre 1 y 500 caracteres",
      };
    }

    // Prepare post data
    const postData: {
      content: string;
      author_id: string;
      image_url?: string;
      latitude?: number;
      longitude?: number;
      location_address?: string;
    } = {
      content: content.trim(),
      author_id: user.id,
    };

    if (imageUrl) {
      postData.image_url = imageUrl;
    }

    if (location) {
      postData.latitude = location.latitude;
      postData.longitude = location.longitude;
      if (location.address) {
        postData.location_address = location.address;
      }
    }

    // Create the post
    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert(postData)
      .select(
        `
        *,
        author:profiles(username, full_name, avatar_url)
      `
      )
      .single();

    if (insertError) {
      console.error("Error creating post:", insertError);
      return { success: false, error: "Error al crear el post" };
    }

    // Transform the response to match our Post interface
    const transformedPost: Post = {
      ...newPost,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
      user_has_bookmarked: false,
    };

    return { success: true, post: transformedPost };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: "Error inesperado" };
  }
}
