-- =====================================================
-- PROFITBOX - STORAGE SETUP
-- Migration: 004_storage_bucket.sql
-- Purpose: Create storage bucket for product images
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================
-- Creates a public bucket for storing product images
-- Users can organize images in folders: {user_id}/product_name.jpg

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE BUCKET DETAILS
-- =====================================================
-- Bucket ID: product-images
-- Public: YES (anyone can view images)
-- Path structure: {user_id}/product_name.jpg
-- Max file size: Configure in Supabase dashboard
-- Allowed MIME types: image/jpeg, image/png, image/webp (recommend to configure)

-- =====================================================
-- RLS POLICIES FOR STORAGE
-- =====================================================
-- Note: RLS policies for storage require path-based permissions
-- Configure these in Supabase dashboard under Storage > product-images > Policies
-- 
-- Recommended policies:
-- 1. Users can upload to their own folder
-- 2. Anyone can view images (public)
-- 3. Users can update their own images
-- 4. Users can delete their own images

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 
-- To upload an image via Frontend:
--   const { data, error } = await supabase.storage
--     .from('product-images')
--     .upload(`${userId}/product-name.jpg`, file)
--
-- To get public URL:
--   const { data } = supabase.storage
--     .from('product-images')
--     .getPublicUrl(`${userId}/product-name.jpg`)
--   // URL: https://[project-url]/storage/v1/object/public/product-images/{userId}/product-name.jpg
--
-- To delete an image:
--   const { error } = await supabase.storage
--     .from('product-images')
--     .remove([`${userId}/product-name.jpg`])

-- =====================================================
-- STORAGE BUCKET COMPLETE ✅
-- =====================================================
-- ✅ Bucket created: product-images
-- ✅ Visibility: Public
-- ⚠️  Configure RLS policies in Supabase dashboard
-- =====================================================
