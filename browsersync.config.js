// Full list of options:
// http://www.browsersync.io/docs/options/
import gulpConfig from "./gulp.config"

export default function(env) {
  const isProduction = (env === "production") || (process.env.NODE_ENV === "production")

  return {
    "server": {
      "baseDir": [gulpConfig.tmp, gulpConfig.build],
      "middleware": isProduction ? [require("compression")()] : []
    },
    "https": false,
    "injectChanges": true,
    "notify": true,
    "open": false,
    "port": 3000,
    "reloadThrottle": 300,
  }
}
