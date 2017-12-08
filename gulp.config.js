// Configures gulp build
// See gulpfile.babel.js for build pipeline
import {resolve} from "path"

export default function(env) {
  const src = resolve(__dirname, "src/")
  const dest = resolve(__dirname, "hugo/")
  const tmp = resolve(__dirname, ".tmp/")
  const build = resolve(__dirname, "dist/")
  const isProduction = process.env.NODE_ENV === "production"

  return {
    src: src,
    dest: dest,
    tmp: tmp,
    build: build,
    hugoArgs: {
      default: ["-v", "--source", dest, "--destination", build],
      development: ["-b", "http://localhost:3000", "--buildDrafts", "--buildFuture", "--buildExpired"],
      production: []
    },
    styles: {
      src:
      [
        src + "/css/*.+(css|scss|sass)",
        src + "/scss/*+(css|scss|sass)"
      ],
      dest: dest + "/static/css",
      tmp: tmp + "/css"
    },
    scripts: {
      src: src + "/js/*+(js|jsx)",
      dest: dest + "/static/js",
      tmp: tmp + "/js"
    },
    images: {
      src: src + "/img/**/*.+(png|jpg|jpeg|gif|svg|webp)",
      dest: dest + "/static/img"
    },
    svg: {
      src: src + "/img/**/*.svg",
      dest: dest + "/layouts/partials/svg",
      config: {
        dest: ".",
        mode: {
          symbol: {
            sprite: "sprite.symbol.svg",
            prefix: "svg-%s",
            dest: "."
          }
        },
        example: (isProduction) ? false : true
      }
    }
  }
}
