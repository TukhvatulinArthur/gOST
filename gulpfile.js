//-----------------------------------ПЛАГИНЫ---------------------------------
import pkg from "gulp";
const { src, dest, parallel, series, watch } = pkg;
import sass from "sass";
import gulpSass from "gulp-sass";
const scss = gulpSass(sass);
import TerserPlugin from "terser-webpack-plugin";
import concat from "gulp-concat";
import gulpIf from "gulp-if";
import browserSync from "browser-sync";
import webpackStream from "webpack-stream";
import autoPrefixer from "gulp-autoprefixer";
import imagemin from "gulp-imagemin";
import del from "del";
import ttf2woff from "gulp-ttf2woff";
import ttf2woff2 from "gulp-ttf2woff2";
import fileInclude from "gulp-file-include";
import webp from "gulp-webp";
import newer from "gulp-newer";
import htmlmin from "gulp-htmlmin";
import svgSprite from "gulp-svg-sprite";
import svgmin from "gulp-svgmin";
import cheerio from "gulp-cheerio";
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
    fontsFiles: `${srcFolder}/resources/fonts/**/*`,
    imgFiles: `${srcFolder}/img/**/*.{jpg,jpeg,png,svg}`,
    indexSCSSFile: `${srcFolder}/index.scss`,
    indexJSFile: `${srcFolder}/index.js`,
    resourceFiles: `${srcFolder}/resources/**/*`,
    fontsFolder: `${srcFolder}/resources/fonts`,
    iconsSprite: `${srcFolder}/img/iconsSprite/*.svg`,
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
    tunnel: true,
  });
  watch(path.src.htmlFiles, html);
  watch(path.src.scssFiles, styles);
  watch(path.src.jsFiles, scripts);
  watch(path.src.imgFiles, parallel(images, webpImages));
};

const cleanBuild = () => {
  return del(buildFolder);
};

const html = () => {
  return src([path.src.htmlFiles, `!${srcFolder}/html/**/_*.html`])
    .pipe(gulpIf(!isDevelop, htmlmin({ collapseWhitespace: true, removeComments: true })))
    .pipe(fileInclude())
    .pipe(dest(buildFolder))
    .pipe(browserSync.stream());
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
  return src([path.src.imgFiles, `!${srcFolder}/img/iconsSprite/*.svg`])
    .pipe(newer(path.build.imgFolder))
    .pipe(
      gulpIf(
        !isDevelop,
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 85, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
        ])
      )
    )
    .pipe(dest(path.build.imgFolder));
};

const webpImages = () => {
  return src([path.src.imgFiles, `!${srcFolder}/img/iconsSprite/*.svg`])
    .pipe(newer(path.build.imgFolder))
    .pipe(webp({ quality: 85 }))
    .pipe(dest(path.build.imgFolder));
};

const fonts = () => {
  src(path.src.fontsFiles).pipe(ttf2woff2()).pipe(dest(path.src.fontsFolder));
  return src(path.src.fontsFiles).pipe(ttf2woff()).pipe(dest(path.src.fontsFolder));
};

const resources = () => {
  return src(`${path.src.resourceFiles}`).pipe(dest(path.build.resourcesFolder));
};

const svgSprites = () => {
  return src(path.src.iconsSprite)
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      })
    )
    .pipe(
      cheerio({
        run: function ($) {
          $("[fill]").removeAttr("fill");
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
        },
        parserOptions: {
          xmlMode: true,
        },
      })
    )
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
      })
    )
    .pipe(dest(path.build.imgFolder));
};

const production = (ready) => {
  isDevelop = false;
  ready();
};

export { html };
export { styles };
export { scripts };

export { fonts };
export { cleanBuild };

export { images };
export { webpImages };

export default series(html, styles, scripts, resources, webpImages, svgSprites, images, watching);
export const build = series(cleanBuild, production, parallel(html, styles, scripts, resources, images, svgSprites, webpImages));
