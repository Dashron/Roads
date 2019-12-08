/**
 * Compiles the input_file node script to be used in the browser.
 *
 * @param  {String} input_file  The source file that will be converted to use in the browser
 * @param  {String} output_file The output file that will be accessible by your browser
 * @param  {Object} [options] A set of options that can influence the build process. See all fields below
 * @param  {boolean} [options.use_sourcemaps] Whether or not the build process should include source maps.
 * @param  {Object} [options.envify] An object to pass to envify. This allows you to change values between your server and client scripts.
 * @param  {Array} [options.exclude] An array of files that should not be included in the build process.
 * @param  {Object} [options.babelify] An object containing parameters to pass to the babelify transform
 * @todo tests
 */
export default function build(input_file: string, output_file: string, options: {
    use_sourcemaps?: any;
    ignore_missing?: any;
    babelify?: any;
    ignore?: any;
    exclude?: any;
    envify?: any;
}): void;
