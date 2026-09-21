import React, { useEffect } from 'react';

/**
 * Dynamic SEO Component for Google Search Engine Optimization & Social Sharing
 */
export default function SEO({ title, description, keywords, canonicalUrl, image, schema }) {
  useEffect(() => {
    // 1. Update Document Title
    const siteTitle = 'LeafOra Life Sciences';
    const fullTitle = title ? `${title} | ${siteTitle}` : `LeafOra Life Sciences | Pure Organic Botanical Skincare & Formulations`;
    document.title = fullTitle;

    // Helper function to update or create meta tags
    const updateMeta = (nameAttr, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function to update link tags
    const updateLink = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Update Standard Meta Tags
    const defaultDesc = "Discover LeafOra Life Sciences - Premium organic botanical skincare, herbal extracts, natural face serums, moisturizers & creams crafted in Nikol, Ahmedabad, Gujarat.";
    const defaultKeywords = "LeafOra Life Sciences, LeafOra skincare, organic skincare India, natural botanical formulations, herbal extracts, face wash Ahmedabad, moisturizer Gujarat, natural serum, SPF 50 sunscreen";

    updateMeta('name', 'description', description || defaultDesc);
    updateMeta('name', 'keywords', keywords || defaultKeywords);

    // 3. Update Canonical Link
    const fullCanonical = canonicalUrl || `https://leaforalifescience.com${window.location.pathname}`;
    updateLink('canonical', fullCanonical);

    // 4. Update Open Graph Meta Tags
    updateMeta('property', 'og:title', fullTitle);
    updateMeta('property', 'og:description', description || defaultDesc);
    updateMeta('property', 'og:url', fullCanonical);
    updateMeta('property', 'og:image', image || 'https://leaforalifescience.com/leafora-logo.png');

    // 5. Dynamic JSON-LD Schema (for Products & Individual Pages)
    let schemaScript = document.getElementById('dynamic-page-schema');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-page-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [title, description, keywords, canonicalUrl, image, schema]);

  return null;
}
