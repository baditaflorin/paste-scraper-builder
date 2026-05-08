export const sampleHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sample Marketplace</title>
    <style>
      body {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background: #f8fafc;
        color: #172033;
      }

      .market {
        max-width: 980px;
        margin: 0 auto;
        padding: 32px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 18px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .product-card {
        border: 1px solid #d7dee8;
        background: white;
        border-radius: 10px;
        padding: 16px;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
      }

      .product-card a {
        color: #0f766e;
        font-weight: 700;
        text-decoration: none;
      }

      .price {
        color: #9a3412;
        font-size: 1.3rem;
        font-weight: 800;
      }

      .rating {
        color: #334155;
      }

      .badge {
        display: inline-flex;
        padding: 4px 8px;
        border-radius: 999px;
        background: #ecfeff;
        color: #155e75;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main class="market">
      <div class="toolbar">
        <div>
          <h1>Sample Marketplace</h1>
          <p>Curated desk gear</p>
        </div>
        <span class="badge">Static sample</span>
      </div>
      <section class="grid">
        <article class="product-card" data-sku="desk-stand">
          <a class="title" href="/products/desk-stand">Oak Desk Stand</a>
          <p class="price">$42</p>
          <p class="rating" title="4.7 stars">4.7 stars</p>
        </article>
        <article class="product-card" data-sku="task-lamp">
          <a class="title" href="/products/task-lamp">Brass Task Lamp</a>
          <p class="price">$89</p>
          <p class="rating" title="4.9 stars">4.9 stars</p>
        </article>
        <article class="product-card" data-sku="cable-kit">
          <a class="title" href="/products/cable-kit">Magnetic Cable Kit</a>
          <p class="price">$19</p>
          <p class="rating" title="4.5 stars">4.5 stars</p>
        </article>
      </section>
    </main>
  </body>
</html>`
