-- Migration: Add post_link column to comments table
-- This allows storing post links directly in comments when uploading CSV data

USE DATABASE MY_DASHBOARD;
USE SCHEMA PUBLIC;

-- Add post_link column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_link VARCHAR(500);

-- Update existing comments to populate post_link from posts table
UPDATE comments c
SET post_link = p.link
FROM posts p
WHERE c.post_id = p.id AND c.post_link IS NULL;
