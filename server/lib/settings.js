// Claves válidas de benjis_content (contenido editable del sitio, banner /
// hero / secciones...) y cuáles de esas claves son booleanas de verdad
// (se guardan como el string 'true'/'false' porque la columna es text).

export const SETTINGS_KEYS = [
  'banner_text_1', 'banner_text_2', 'banner_text_3', 'banner_visible', 'accent_color',
  'gallery_brand_text', 'gallery_subtitle_text', 'gallery_image_url',
  'unicos_title_1', 'unicos_title_2', 'unicos_paragraph', 'unicos_link_text',
  'cta_title', 'cta_paragraph', 'cta_button_text',
  'custom_title_1', 'custom_title_2', 'custom_paragraph', 'custom_image_url',
  'about_subtitle', 'about_proceso_title', 'about_proceso_paragraph', 'about_proceso_image_url',
  'about_materiales_title_1', 'about_materiales_title_2', 'about_materiales_paragraph',
  'about_materiales_link_text', 'about_materiales_image_url'
];

export const BOOLEAN_SETTINGS = new Set(['banner_visible']);
