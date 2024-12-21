// imports for the various eleventy plugins (navigation & image)
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const { DateTime } = require('luxon');
const Image = require('@11ty/eleventy-img');
const path = require('path');

// allows the use of {% image... %} to create responsive, optimized images
async function imageShortcode(src, alt, className, loading, sizes = '(max-width: 600px) 400px, 850px') {
  // Ensure the `alt` attribute is provided
  if (alt === undefined) {
    throw new Error(`Missing 'alt' attribute on responsive image: ${src}`);
  }

  // Create the metadata for an optimized image
  let metadata = await Image(`${src}`, {
    widths: [null],
    formats: ['webp', 'jpeg'],
    urlPath: '/images/',
    outputDir: './_site/images',
    sharpOptions: { quality: 100 }, // Ensures high-quality outputs
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  });

  // Get the smallest and largest images for <picture> and <img> attributes
  let lowsrc = metadata.jpeg[0];
  let highsrc = metadata.jpeg[metadata.jpeg.length - 1];

  // Return the responsive image HTML
  return `<picture class="${className}">
    ${Object.values(metadata)
      .map((imageFormat) => {
        return `<source type="${imageFormat[0].sourceType}" srcset="${imageFormat
          .map((entry) => entry.srcset)
          .join(', ')}" sizes="${sizes}">`;
      })
      .join('\n')}
      <img
        src="${lowsrc.url}"
        width="${highsrc.width}"
        height="${highsrc.height}"
        alt="${alt}"
        loading="${loading}"
        decoding="async">
    </picture>`;
}

module.exports = function (eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Pass-through file copies
  eleventyConfig.addPassthroughCopy('./src/css/**/*.css');
  eleventyConfig.addPassthroughCopy('./src/assets');
  eleventyConfig.addPassthroughCopy('./src/admin');
  eleventyConfig.addPassthroughCopy('./src/_redirects');
  eleventyConfig.addPassthroughCopy({ './src/robots.txt': '/robots.txt' });

  // Configure BrowserSync
  eleventyConfig.setBrowserSyncConfig({
    open: true,
    files: './_site/css/**/*.css',
  });

  // Add the {% image %} shortcode
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);

  // Add a filter for formatting dates
  eleventyConfig.addFilter('postDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  // Return Eleventy configuration
  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      output: '_site', // Changed from 'public' to '_site'
    },
    htmlTemplateEngine: 'njk',
  };
};
