import BrowserSync from "browser-sync"
import browserSyncConfig from "./browsersync.config"
import del from "del"
import gulp from "gulp"
import gulpConfig from "./gulp.config.js"
import hugo from "hugo-bin"
import imagemin from "gulp-imagemin"
import named from "vinyl-named"
import newer from "gulp-newer"
import postcss from "gulp-postcss"
import rename from "gulp-rename"
import runsequence from "run-sequence"
import {spawn} from "child_process"
import sprite from "gulp-svg-sprite"
import util from "gulp-util"
import webpack from "webpack-stream"
import webpackConfig from "./webpack.config"

const env = process.env.HUGO_ENV = process.env.NODE_ENV || "development"
const isProduction = (env === "production")
const browserSync = BrowserSync.create()

/**
 * @task hugo
 * Runs hugo with environment-based
 * build arguments
 */
gulp.task("hugo", (cb) => build(cb))

/**
 * @task server
 * Initializes browsersync server and
 * sets up watch tasks to rebuild
 */
gulp.task("server", ["build"], () => {
  browserSync.init(browserSyncConfig())
  gulp.watch(gulpConfig.styles.src, () => gulp.start("styles"))
  gulp.watch(gulpConfig.scripts.src, () => gulp.start("scripts"))
  gulp.watch(gulpConfig.images.src, () => gulp.start("images"))
  gulp.watch(gulpConfig.svg.src, () => gulp.start("svg"))
  gulp.watch(
    [
      gulpConfig.dest + "/**/*",
      `!${gulpConfig.styles.src}`,
      `!${gulpConfig.scripts.src}`,
      `!${gulpConfig.images.src}`,
      `!${gulpConfig.svg.src}`
    ],
  () => gulp.start("hugo"))
})

/**
 * @task build
 * Builds all static assets, and then
 * compiles the static site with Hugo
 */
gulp.task("build", ["clean"], (cb) => {
  runsequence(["styles", "scripts", "images", "svg"], "hugo", cb)
})

/**
 * @task styles
 * Compiles all css
 */
gulp.task("styles", (cb) => {
  runsequence("styles:production", "styles:development", cb)
})

/**
 * @task styles:production
 * Compiles the production-ready CSS to static/css/
 * and streams it if its a production server environment
 */
gulp.task("styles:production", (cb) => {
  const task = gulp.src(gulpConfig.styles.src)
    .pipe(postcss({env: "production"})
     .on("error", (err) => log(err, err.toString(), "PostCSS")))
    .pipe(rename({
      dirname: "/",
      extname: ".min.css"
    }))
    .pipe(gulp.dest(gulpConfig.styles.dest))

  if (isProduction) {
    task.pipe(browserSync.stream())
  }

  return task
})

/**
 * @task styles:development
 * Generates the non-production styles to .tmp/css/
 * and streams it if its a development server environment
 */
gulp.task("styles:development", (cb) => {
  if (isProduction) return cb()

  return gulp.src(gulpConfig.styles.src)
    .pipe(postcss()
      .on("error", (err) => log(err, err.toString(), "PostCSS")))
    .pipe(rename({
      dirname: "/",
      extname: ".min.css"
    }))
    .pipe(gulp.dest(gulpConfig.styles.tmp))
    .pipe(browserSync.stream())
})

/**
 * @task styles
 * Compiles all js
 */
gulp.task("scripts", (cb) => {
  runsequence("scripts:production", "scripts:development", cb)
})

/**
 * @task scripts:production
 * Compiles the production-ready JS to static/js/
 * and streams it if its a production server environment
 */
gulp.task("scripts:production", (cb) => {
  const task = gulp.src(gulpConfig.scripts.src)
    .pipe(named())
    .pipe(webpack(webpackConfig("production"), null, (err, stats) => {
      log(err, stats.toString({colors: true, errors: true, progress: true}), "Webpack")
    }))
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(gulp.dest(gulpConfig.scripts.dest))

  if (isProduction) {
    task.pipe(browserSync.stream())
  }

  return task
})

/**
 * @task scripts:development
 * Generates the non-production styles to .tmp/css/
 * and streams it if its a development server environment
 */
gulp.task("scripts:development", (cb) => {
  if (isProduction) return cb()

  return gulp.src(gulpConfig.scripts.src)
    .pipe(named())
    .pipe(webpack(webpackConfig()), null, (err, stats) => {
      log(err, stats.toString({colors: true, errors: true, progress: true}), "Webpack")
    })
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(gulp.dest(gulpConfig.scripts.tmp))
    .pipe(browserSync.stream())
})

/**
 * @task images
 * Optimizes all images
 * and streams it if its a development server environment
 */
gulp.task("images", () => {
  return gulp.src(gulpConfig.images.src)
      .pipe(newer(gulpConfig.images.dest))
      .pipe(imagemin([], {verbose: (isProduction) ? true : false}))
      .pipe(gulp.dest(gulpConfig.images.dest))
      .pipe(browserSync.stream())
})

gulp.task("svg", () => {
  return gulp.src(gulpConfig.svg.src)
    .pipe(sprite(gulpConfig.svg.config)
      .on("error", (err) => log(err, err.toString(), "SVG Sprite")))
    .pipe(gulp.dest(gulpConfig.svg.dest))
    .pipe(browserSync.stream())
})

gulp.task("clean", () => {
  return del([gulpConfig.tmp, gulpConfig.build], {dot: true});
})

/**
 * Execute Hugo with Build Arguments based
 * upon environment variables
 * @param {Function} cb
 */
function build(cb) {
  const args = gulpConfig.hugoArgs.default.concat(gulpConfig.hugoArgs[env] || [])
  const generator = spawn(hugo, args, {stdio: "pipe", encoding: "utf-8"})

  generator.stdout.on("data", (data) => {
    log(null, data.toString(), "Hugo")
  })

  generator.stderr.on("data", (data) => {
    log(null, data.toString(), "Hugo")
  })

  generator.on("error", (err) => {
    log(err, err.toString(), "Hugo")
    browserSync.notify("Build Failed")
    return cb("Build failed")
  })

  generator.on("close", (code) => {
    browserSync.reload()
    cb()
  })
}

/**
 * Logs errors and messages to the
 * console
 *
 * @param {Error} err
 * @param {String} log
 * @param {String} name
 */
function log(err, log, name) {
  const messages = log.replace(/^,|,$/g, "").split("\n") // Get rid leading/trailing commas
  const spacer = " ".repeat(name.length + 2) // Indent additional lines

  if (err) {
    util.beep()
    browserSync.notify(err.message)
  }

  messages.forEach((message, i) => {
    if (i === 0) {
      util.log("[" + util.colors.blue(name) + "]", message)
    } else {
      util.log(spacer, message)
    }
  })
}
