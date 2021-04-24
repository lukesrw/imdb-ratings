const fs = require("fs");
const path = require("path");

let ignored;

/**
 * @param {string} file name
 * @param {Array} files in directory
 * @returns {boolean} is compiled or not
 */
function isCompiledFile(file, files) {
    let file_sub1 = file.substr(0, file.lastIndexOf("."));
    let file_sub2 = file.substr(0, file_sub1.lastIndexOf("."));
    let file_sub3 = file.substr(0, file_sub2.lastIndexOf("."));

    return (
        (file.endsWith(".d.ts.map") && files.includes(`${file_sub3}.ts`)) ||
        (file.endsWith(".d.ts") && files.includes(`${file_sub2}.ts`)) ||
        (file.endsWith(".js.map") && files.includes(`${file_sub2}.ts`)) ||
        (file.endsWith(".js") && files.includes(`${file_sub1}.ts`)) ||
        (file.endsWith(".css.map") && files.includes(`${file_sub2}.scss`)) ||
        (file.endsWith(".css") && files.includes(`${file_sub1}.scss`))
    );
}

/**
 * @param {Array} source to target
 * @returns {void}
 */
async function clean(source = []) {
    let items = await fs.promises.readdir(path.join(...source));
    items = items.filter(item => {
        return !item.startsWith(".");
    });

    if (typeof ignored === "undefined") {
        try {
            // eslint-disable-next-line require-atomic-updates
            ignored = await fs.promises.readFile(path.join(...source, ".gitignore"), "utf-8");

            ignored = ignored.split("\n").map(ignore => ignore.trim());
        } catch (_1) {
            ignored = [];
        }
    }

    for (let index = 0; index < items.length; index += 1) {
        let item_path = path.join(...source.concat(items[index]));
        let item_stats = await fs.promises.stat(item_path);
        if (item_stats.isDirectory() && !ignored.includes(items[index])) {
            await clean(source.concat(items[index]));
        }
        if (item_stats.isFile() && isCompiledFile(items[index], items)) {
            await fs.promises.unlink(item_path);
        }
    }
}

clean([__dirname]);
