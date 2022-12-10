//-----------------------------------ПЛАГИНЫ---------------------------------
import pkg from "gulp";
const { src, dest, parallel, series, watch } = pkg;
import sass from "sass";
import gulpSass from "gulp-sass";
const scss = gulpSass(sass);
import TerserPlugin from "terser-webpack-plugin";
import concat from "gulp-concat";
import browserSync from "browser-sync";
import webpackStream from "webpack-stream";
import autoPrefixer from "gulp-autoprefixer";
import imagemin from "gulp-imagemin";
import del from "del";
import newer from "gulp-newer";
import gcmq from "gulp-group-css-media-queries";
import cleanCSS from "gulp-clean-css";
//-----------------------------------ПЛАГИНЫ---------------------------------
//-----------------------------------ПУТИ------------------------------------
const srcFolder = "./src";
const buildFolder = "./build";
const path = {
  src: {
    htmlFiles: `${srcFolder}/**/*.html`,
    scssFiles: `${srcFolder}/**/*.scss`,
    jsFiles: `${srcFolder}/**/*.js`,
    imgFiles: `${srcFolder}/img/**/*.{jpg,jpeg,png,svg}`,
    indexSCSSFile: `${srcFolder}/index.scss`,
    indexJSFile: `${srcFolder}/index.js`,
    resourceFiles: `${srcFolder}/resources/**/*`,
  },
  build: {
    imgFolder: `${buildFolder}/img`,
    cssFolder: `${buildFolder}/css`,
    jsFolder: `${buildFolder}/js`,
    resourcesFolder: `${buildFolder}/resources`,
  },
};
//-----------------------------------ПУТИ------------------------------------

let isDevelop = true;

const watching = () => {
  browserSync.init({
    server: {
      baseDir: buildFolder,
    },
    notify: false,
  });
  watch(path.src.htmlFiles, html);
  watch(path.src.scssFiles, styles);
  watch(path.src.jsFiles, scripts);
  watch(path.src.imgFiles, images);
  watch(path.src.resourceFiles, resources);
};

const cleanBuild = () => {
  return del(buildFolder);
};

const html = () => {
  return src(path.src.htmlFiles).pipe(dest(buildFolder)).pipe(browserSync.stream());
};

const styles = () => {
  return src(path.src.indexSCSSFile, { sourcemaps: isDevelop })
    .pipe(scss())
    .pipe(concat("index.min.css"))
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ["last 2 version"],
        grid: true,
      })
    )
    .pipe(gcmq())
    .pipe(cleanCSS())
    .pipe(dest(path.build.cssFolder, { sourcemaps: "." }))
    .pipe(browserSync.stream());
};

const scripts = () => {
  return src(path.src.indexJSFile)
    .pipe(
      webpackStream({
        mode: isDevelop ? "development" : "production",
        devtool: isDevelop ? "source-map" : false,
        output: {
          filename: "index.min.js",
        },
        performance: { hints: false },
        optimization: {
          minimize: true,
          minimizer: [new TerserPlugin()],
        },
        module: {
          rules: [
            {
              test: /\.(js)$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env"],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(dest(path.build.jsFolder))
    .pipe(browserSync.stream());
};

const images = () => {
  return src(path.src.imgFiles)
    .pipe(newer(path.build.imgFolder))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 85, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
      ])
    )
    .pipe(dest(path.build.imgFolder));
};

const resources = () => {
  return src(`${path.src.resourceFiles}`).pipe(dest(path.build.resourcesFolder));
};

const production = (ready) => {
  isDevelop = false;
  ready();
};

export { html };
export { styles };
export { scripts };

export { cleanBuild };

export { images };

export default series(html, styles, scripts, resources, images, watching);
export const build = series(cleanBuild, production, parallel(html, styles, scripts, resources, images));
