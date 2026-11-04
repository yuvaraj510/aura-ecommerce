import os
import json
from flask import Flask, render_template, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = 'aura_super_secret_key' # Needed for sessions

categories = [
    {"name": "Sarees", "image": "images/saree_red.png", "id": "saree"},
    {"name": "Kurtis", "image": "images/kurti_yellow.png", "id": "kurti"},
    {"name": "Suits", "image": "images/suit_green.png", "id": "suit"},
    {"name": "Dresses", "image": "images/dress_black.png", "id": "dresses"},
    {"name": "Tops & Coats", "image": "images/coat_camel.png", "id": "tops"},
    {"name": "Activewear", "image": "images/leggings_grey.png", "id": "activewear"},
    {"name": "Accessories", "image": "images/bag_leather.png", "id": "accessories"},
    {"name": "Makeup", "image": "images/makeup_lip.png", "id": "makeup"}
]

PRODUCTS_FILE = 'products.json'
def load_products():
    if os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, 'r') as f:
            return json.load(f)
    # Default products if no file exists
    return [
        {"name": "Red Cotton Printed Saree", "price": "₹450", "original_price": "₹699", "image": "images/saree_red.png", "id": 1, "category": "saree"},
        {"name": "Blue Georgette Floral Saree", "price": "₹650", "image": "images/saree_blue.png", "id": 2, "category": "saree"},
        {"name": "Yellow Rayon A-Line Kurti", "price": "₹399", "original_price": "₹599", "image": "images/kurti_yellow.png", "id": 3, "category": "kurti"},
        {"name": "Green Cotton Salwar Suit", "price": "₹550", "image": "images/suit_green.png", "id": 4, "category": "suit"},
        {"name": "Black Silk Slip Dress", "price": "₹1200", "original_price": "₹1500", "image": "images/dress_black.png", "id": 5, "category": "dresses"},
        {"name": "White Linen Wrap Top", "price": "₹800", "image": "images/top_white.png", "id": 6, "category": "tops"},
        {"name": "Camel Wool Trench Coat", "price": "₹2500", "original_price": "₹3200", "image": "images/coat_camel.png", "id": 7, "category": "tops"},
        {"name": "Grey Seamless Leggings", "price": "₹600", "image": "images/leggings_grey.png", "id": 8, "category": "activewear"},
        {"name": "Classic Leather Handbag", "price": "₹1800", "image": "images/bag_leather.png", "id": 9, "category": "accessories"},
        {"name": "Premium Matte Lipstick", "price": "₹250", "image": "images/makeup_lip.png", "id": 10, "category": "makeup"}
    ]

def save_products(products_data):
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(products_data, f)

products = load_products()

orders = []

REVIEWS_FILE = 'reviews.json'
def load_reviews():
    if os.path.exists(REVIEWS_FILE):
        with open(REVIEWS_FILE, 'r') as f:
            # json keys are always strings, so we convert back to ints for product_id matching
            loaded = json.load(f)
            return {int(k): v for k, v in loaded.items()}
    return {}

def save_reviews(reviews_data):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump(reviews_data, f)

reviews = load_reviews() # mapping product_id to list of review dicts
customers = {} # mock database for customer accounts

@app.route('/')
def home():
    return render_template('index.html', categories=categories[:3], products=products[:4])

@app.route('/shop')
def shop():
    category_filter = request.args.get('category')
    filtered_products = products
    if category_filter:
        filtered_products = [p for p in products if p['category'] == category_filter.lower()]
    return render_template('shop.html', products=filtered_products, categories=categories, current_category=category_filter)

@app.route('/search')
def search():
    query = request.args.get('q', '').lower()
    results = [p for p in products if query in p['name'].lower()]
    return render_template('search.html', query=query, products=results)

@app.route('/collections')
def collections():
    return render_template('collections.html', categories=categories)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username in customers:
            error = "Account already exists. Please log in."
        else:
            customers[username] = password
            session['user'] = username
            return redirect(url_for('account'))
    return render_template('signup.html', error=error)

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username not in customers:
            error = "Account doesn't exist. Please create a new account."
        elif customers[username] != password:
            error = "Invalid password."
        else:
            session['user'] = username
            return redirect(url_for('account'))
    return render_template('login.html', error=error)

@app.route('/admin_login', methods=['GET', 'POST'])
def admin_login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == 'admin' and password == 'admin123':
            session['user'] = username
            return redirect(url_for('admin_panel'))
        else:
            error = "Invalid credentials. Only the admin account is allowed."
    return render_template('admin_login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('home'))

@app.route('/account')
def account():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('account.html', user=session['user'])

# Context processor to make 'current_user' available in all templates
@app.context_processor
def inject_user():
    return dict(current_user=session.get('user'))

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/product/<int:product_id>', methods=['GET', 'POST'])
def product_detail(product_id):
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return "Product not found", 404
        
    if request.method == 'POST':
        rating = request.form.get('rating')
        text = request.form.get('text')
        user = session.get('user', 'Guest')
        if product_id not in reviews:
            reviews[product_id] = []
        reviews[product_id].append({'user': user, 'rating': rating, 'text': text})
        save_reviews(reviews)
        return redirect(url_for('product_detail', product_id=product_id))
        
    product_reviews = reviews.get(product_id, [])
    return render_template('product.html', product=product, reviews=product_reviews)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    order = {
        "id": len(orders) + 1,
        "user": session.get('user', data.get('customer_name', 'Guest')),
        "items": data.get('items', []),
        "total": data.get('total', '₹0'),
        "payment_method": data.get('payment_method', 'Unknown'),
        "status": "Placed"
    }
    orders.append(order)
    return {"status": "success", "order_id": order["id"]}

@app.route('/admin')
def admin_panel():
    if session.get('user') != 'admin':
        return redirect(url_for('admin_login'))
    
    # Flatten reviews for the admin panel to easily display them all
    all_reviews = []
    for pid, rev_list in reviews.items():
        prod = next((p for p in products if p['id'] == pid), None)
        prod_name = prod['name'] if prod else "Unknown Product"
        for r in rev_list:
            all_reviews.append({
                'product_name': prod_name,
                'user': r['user'],
                'rating': r['rating'],
                'text': r['text']
            })
            
    return render_template('admin.html', orders=orders, all_reviews=all_reviews, products=products, categories=categories)

@app.route('/admin/add_product', methods=['POST'])
def add_product():
    if session.get('user') != 'admin':
        return redirect(url_for('admin_login'))
    
    name = request.form.get('name')
    price = request.form.get('price')
    if not price.startswith('₹'):
        price = '₹' + price
    category = request.form.get('category')
    
    # Auto-assign image based on category for simplicity
    image_map = {
        'kurti': 'images/kurti.png',
        'saree': 'images/saree.png',
        'suit': 'images/suit.png',
        'bottoms': 'images/bottoms.png',
        'dupatta': 'images/dupatta.png',
        'makeup': 'images/makeup.png'
    }
    image = image_map.get(category, 'images/hero.webp')
    
    new_id = max([p['id'] for p in products], default=0) + 1
    new_product = {
        "id": new_id,
        "name": name,
        "price": price,
        "category": category,
        "image": image
    }
    products.append(new_product)
    save_products(products)
    return redirect(url_for('admin_panel'))

@app.route('/admin/delete_product/<int:product_id>', methods=['POST'])
def delete_product(product_id):
    if session.get('user') != 'admin':
        return redirect(url_for('admin_login'))
    
    global products
    products = [p for p in products if p['id'] != product_id]
    save_products(products)
    return redirect(url_for('admin_panel'))

@app.route('/update_order_status/<int:order_id>', methods=['POST'])
def update_order_status(order_id):
    if session.get('user') != 'admin':
        return redirect(url_for('admin_login'))
    
    new_status = request.form.get('status')
    for order in orders:
        if order['id'] == order_id:
            order['status'] = new_status
            break
            
    return redirect(url_for('admin_panel'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
