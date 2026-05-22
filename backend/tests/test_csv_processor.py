"""
test_csv_processor.py — Unit tests for the CSV column detection & processing service.

Tests cover:
  - Header normalization (fuzzy matching, aliases)
  - Category detection (posts, kpis, comments, consolidated, unknown)
  - Edge cases (empty headers, partial matches, case insensitivity)
"""

import pytest
from app.services.csv_processor import normalize_headers, detect_categories


class TestNormalizeHeaders:
    """Verify that raw CSV headers are correctly mapped to canonical field names."""

    def test_exact_match(self):
        headers = ["Title", "Detail", "Link", "Source"]
        result = normalize_headers(headers)
        assert result["Title"] == "title"
        assert result["Detail"] == "detail"
        assert result["Link"] == "link"
        assert result["Source"] == "source"

    def test_case_insensitive(self):
        headers = ["TITLE", "detail", "LINK", "SOURCE"]
        result = normalize_headers(headers)
        assert result["TITLE"] == "title"
        assert result["detail"] == "detail"
        assert result["LINK"] == "link"

    def test_with_spaces(self):
        headers = ["Publish date", "Update date", "Media type"]
        result = normalize_headers(headers)
        assert result["Publish date"] == "publish_date"
        assert result["Update date"] == "update_date"
        assert result["Media type"] == "media_type"

    def test_alias_variations(self):
        """Different header names that should all map to the same canonical field."""
        headers = ["Post Content", "Post URL", "Engagement", "Author handle (@username)"]
        result = normalize_headers(headers)
        assert result["Post Content"] == "detail"
        assert result["Post URL"] == "link"
        assert result["Engagement"] == "total_engagement"
        assert result["Author handle (@username)"] == "author_handle"

    def test_unknown_headers_passthrough(self):
        """Unrecognized headers should be normalized but kept as-is."""
        headers = ["My Custom Column", "Another Thing"]
        result = normalize_headers(headers)
        assert result["My Custom Column"] == "my_custom_column"
        assert result["Another Thing"] == "another_thing"

    def test_whitespace_trimming(self):
        headers = ["  Title  ", "  Detail  "]
        result = normalize_headers(headers)
        assert result["  Title  "] == "title"
        assert result["  Detail  "] == "detail"

    def test_kpi_headers(self):
        headers = ["Metric Name", "Metric Value", "Report Date"]
        result = normalize_headers(headers)
        assert result["Metric Name"] == "metric_name"
        assert result["Metric Value"] == "metric_value"
        assert result["Report Date"] == "report_date"

    def test_comment_headers(self):
        headers = ["Comment Text", "Comment Date", "Keyword Tag", "Keyword Type"]
        result = normalize_headers(headers)
        assert result["Comment Text"] == "comment_text"
        assert result["Comment Date"] == "comment_date"
        assert result["Keyword Tag"] == "keyword_tag"
        assert result["Keyword Type"] == "keyword_type"


class TestDetectCategories:
    """Verify that category detection works for various CSV column combinations."""

    def test_posts_only(self):
        """CSV with only post-related columns → should detect 'posts'."""
        headers = ["Title", "Detail", "Link", "Source", "Publish date", "Sentiment"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "posts" in categories
        assert "kpis" not in categories
        assert "comments" not in categories

    def test_kpis_only(self):
        """CSV with only KPI columns → should detect 'kpis'."""
        headers = ["Metric Name", "Metric Value", "Report Date"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "kpis" in categories
        assert "posts" not in categories
        assert "comments" not in categories

    def test_kpis_minimal(self):
        """Even just metric_name + metric_value (2 cols) should be enough."""
        headers = ["KPI", "Value"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "kpis" in categories

    def test_comments_only(self):
        """CSV with only comment columns → should detect 'comments'."""
        headers = ["Comment Text", "Comment Date", "Keyword Tag", "Keyword Type"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "comments" in categories
        assert "posts" not in categories

    def test_consolidated_posts_and_comments(self):
        """CSV with both post AND comment columns → should detect both."""
        headers = [
            "Title", "Detail", "Link", "Publish date", "Sentiment",
            "Comment Text", "Comment Date", "Keyword Tag",
        ]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "posts" in categories
        assert "comments" in categories

    def test_consolidated_all_three(self):
        """CSV with all categories → should detect all three."""
        headers = [
            "Title", "Detail", "Link",       # posts
            "Metric Name", "Metric Value",    # kpis
            "Comment Text", "Comment Date",   # comments
        ]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert categories == {"posts", "kpis", "comments"}

    def test_unknown_csv(self):
        """CSV with no recognizable columns → empty set."""
        headers = ["Foo", "Bar", "Baz", "Qux"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert categories == set()

    def test_single_post_column_insufficient(self):
        """Only 1 post signature column is below the threshold of 2."""
        headers = ["Title"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "posts" not in categories

    def test_two_post_columns_sufficient(self):
        """Exactly 2 post signature columns meets the threshold."""
        headers = ["Title", "Sentiment"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "posts" in categories

    def test_uses_aliases(self):
        """Aliases like 'Content' (→ detail) and 'URL' (→ link) should count."""
        headers = ["Content", "URL", "Platform"]
        field_map = normalize_headers(headers)
        categories = detect_categories(field_map)
        assert "posts" in categories

    def test_empty_headers(self):
        """Empty header list → no categories."""
        field_map = normalize_headers([])
        categories = detect_categories(field_map)
        assert categories == set()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
