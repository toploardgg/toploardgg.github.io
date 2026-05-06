from api import views
from django.urls import path, re_path

handler404 = "api.views.handler404"
handler429 = "api.views.handler429"

urlpatterns = [
    # HTML страницы
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("stats/", views.stats, name="stats"),
    path("config/", views.config, name="config"),
    # API
    path("api/stats", views.get_stats, name="get-stats"),
    path("api/comments", views.comments, name="comments"),
    path("api/comments/<int:comment_id>", views.delete_comment, name="delete-comment"),
    path("api/validate-email", views.validate_email, name="validate-email"),
    path("api/blog/likes", views.blog_likes),
    re_path(r"^.*$", views.handler404),
]
