// Learn more about PostCSS:
// https://github.com/postcss/postcss

module.exports = function(ctx = {}) {
  const file = ctx.file
  const opts = ctx.options || {}
  const isProduction = (opts.env === "production") || (process.env.NODE_ENV === "production")

  return {
    parser: opts.parser ? opts.parser : false,
    map: (isProduction) ? {inline: false} : false,
    plugins: {
      "postcss-import": {},
      "postcss-cssnext": {},
      "cssnano": (isProduction) ? {autoprefixer: false} : false,
      "postcss-reporter": {},
      "postcss-browser-reporter": (isProduction) ? {} : false
    }
  }
}
