# Varsity Jacket Customizer

This folder contains a standalone 2D varsity jacket customizer with four views and design placement areas.

## How to Use Locally

Open `customizer/index.html` in a browser. The customizer runs without a build step.

## Shopify Integration

### 1) Product Page Embed

- Add the HTML from `customizer/index.html` into a theme section or snippet.
- Replace `{{ VARIANT_ID }}` with `{{ product.selected_or_first_available_variant.id }}`.
- Update the form action if you use a custom cart route.
- The customizer data will be stored in line item properties under `Customizer JSON`.

### 2) Dedicated Customizer Page

- Create a new Shopify Page template and paste the customizer HTML.
- Hardcode `{{ VARIANT_ID }}` to a specific varsity product variant ID, or add a selector for multiple products.
- Link to the page from your navigation or product grid.

### 3) Optional Enhancements

- Save a rendered preview image (requires a canvas or svg export step).
- Add pricing logic for extra patches/placements.
- Add font/text tools in addition to image uploads.

## Placement Map

Front view:
- Left chest
- Right chest
- Center front
- Near both pockets
- Left sleeve
- Right sleeve

Back view:
- Top back
- Center back
- Lower back

Left view:
- Left sleeve
- Side body

Right view:
- Right sleeve
- Side body
