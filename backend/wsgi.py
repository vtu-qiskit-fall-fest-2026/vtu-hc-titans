import os

from app import app


DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

if os.path.isdir(DIST_DIR):
    from flask import jsonify, send_from_directory
    from werkzeug.utils import safe_join

    def serve_frontend(path=""):
        if path == "api" or path.startswith("api/"):
            return jsonify(
                {
                    "error": {
                        "code": "not_found",
                        "message": "API endpoint not found.",
                    }
                }
            ), 404

        requested_file = safe_join(DIST_DIR, path)
        if requested_file and os.path.isfile(requested_file):
            return send_from_directory(DIST_DIR, path)

        return send_from_directory(DIST_DIR, "index.html")

    app.add_url_rule(
        "/", endpoint="frontend_index", view_func=serve_frontend, defaults={"path": ""}
    )
    app.add_url_rule("/<path:path>", endpoint="frontend_path", view_func=serve_frontend)
