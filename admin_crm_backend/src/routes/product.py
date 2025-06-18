from flask import Blueprint, request, jsonify
from datetime import datetime
from src.main import db
from src.models.user import Product, Download

product_bp = Blueprint("product_bp", __name__)

@product_bp.route("/products", methods=["POST"])
def create_product():
    data = request.get_json()
    new_product = Product(
        name=data["name"],
        description=data.get("description"),
        file_path=data["file_path"],
        price=data.get("price", 0.00),
        is_template=data.get("is_template", False)
    )
    db.session.add(new_product)
    db.session.commit()
    return jsonify({"message": "Product created successfully", "product": new_product.name}), 201

@product_bp.route("/products", methods=["GET"])
def get_products():
    products = Product.query.all()
    products_data = []
    for product in products:
        products_data.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "file_path": product.file_path,
            "price": str(product.price),
            "is_template": product.is_template,
            "created_at": product.created_at.isoformat()
        })
    return jsonify({"products": products_data}), 200

@product_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "file_path": product.file_path,
        "price": str(product.price),
        "is_template": product.is_template,
        "created_at": product.created_at.isoformat()
    }), 200

@product_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)
    product.file_path = data.get("file_path", product.file_path)
    product.price = data.get("price", product.price)
    product.is_template = data.get("is_template", product.is_template)
    db.session.commit()
    return jsonify({"message": "Product updated successfully", "product": product.name}), 200

@product_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted successfully"}), 204

@product_bp.route("/downloads", methods=["POST"])
def track_download():
    data = request.get_json()
    user_id = data.get("user_id") # Assuming user_id is passed or retrieved from session
    product_id = data["product_id"]

    new_download = Download(
        user_id=user_id,
        product_id=product_id,
        timestamp=datetime.utcnow()
    )
    db.session.add(new_download)
    db.session.commit()
    return jsonify({"message": "Download tracked successfully"}), 201

@product_bp.route("/downloads", methods=["GET"])
def get_downloads():
    downloads = Download.query.all()
    downloads_data = []
    for download in downloads:
        downloads_data.append({
            "id": download.id,
            "user_id": download.user_id,
            "product_id": download.product_id,
            "timestamp": download.timestamp.isoformat()
        })
    return jsonify({"downloads": downloads_data}), 200


