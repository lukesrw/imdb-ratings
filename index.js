const { createReadStream, readFileSync, writeFileSync } = require("fs");
const csv = require("csv-parser");
const { join } = require("path");
const { createInterface } = require("readline");
const io = createInterface({
    input: process.stdin,
    output: process.stdout
});

const ANSWERS_JSON = join(__dirname, "answers.json");

let results = [];
let type = {};

/**
 * Cache from previous answers given
 */
let answers = {};
try {
    answers = JSON.parse(readFileSync(ANSWERS_JSON, "utf-8"));
} catch (e) {}

/**
 * @param {string} title1 rating1
 * @param {string} title2 rating2
 * @returns {Promise<Boolean>} decision
 */
function ask(title1, title2) {
    return new Promise(resolve => {
        /**
         * If this question has been asked before
         */
        if (
            Object.prototype.hasOwnProperty.call(answers, title1) &&
            Object.prototype.hasOwnProperty.call(answers[title1], title2)
        ) {
            return resolve(answers[title1][title2]);
        }

        /**
         * Prompt in console for '"Movie 1" (1) or "Movie 2" (2)?'
         */
        return io.question(`"${title1}" (1) or "${title2}" (2)? `, answer => {
            if (!Object.prototype.hasOwnProperty.call(answers, title1)) {
                answers[title1] = {};
            }
            answers[title1][title2] = parseInt(answer, 10) === 1 ? -1 : 1;

            if (!Object.prototype.hasOwnProperty.call(answers, title2)) {
                answers[title2] = {};
            }
            answers[title2][title1] = answers[title1][title2] * -1;

            writeFileSync(ANSWERS_JSON, JSON.stringify(answers));

            return resolve(answers[title1][title2]);
        });
    });
}

/**
 * @param {Array<object>} results ratings
 * @returns {Array<object>} sorted results
 */
function sort(results) {
    return results.sort((rating1, rating2) => {
        /**
         * If manual sort has been given, use this primarily
         */
        if (
            Object.prototype.hasOwnProperty.call(answers, rating1.Title) &&
            Object.prototype.hasOwnProperty.call(
                answers[rating1.Title],
                rating2.Title
            )
        ) {
            return answers[rating1.Title][rating2.Title];
        }

        /**
         * Otherwise use "Your Rating"
         */
        if (rating1["Your Rating"] > rating2["Your Rating"]) return -1;
        if (rating2["Your Rating"] > rating1["Your Rating"]) return 1;

        /**
         * Otherwise use "IMDb Rating"
         */
        if (rating1["IMDb Rating"] > rating2["IMDb Rating"]) return -1;
        if (rating2["IMDb Rating"] > rating1["IMDb Rating"]) return -1;

        return 0;
    });
}

/**
 * @returns {void}
 */
function outputSorted() {
    let type_min = JSON.parse(JSON.stringify(type));
    for (let name_min in type_min) {
        if (
            Object.prototype.hasOwnProperty.call(type_min, name_min) &&
            typeof name_min === "string"
        ) {
            type_min[name_min] = type_min[name_min].map(rating => rating.Title);
        }
    }

    /**
     * Write to sorted.json the in-progress sorting (just "Title")
     */
    writeFileSync(
        join(__dirname, "sorted.json"),
        JSON.stringify(type_min, null, 4)
    );
}

/**
 * Begin process of asking manual sort questions
 *
 * @returns {void}
 */
async function main() {
    let answer;

    for (let name in type) {
        if (Object.prototype.hasOwnProperty.call(type, name)) {
            for (let i = 0; i < type[name].length; i += 1) {
                if (Object.prototype.hasOwnProperty.call(type[name], i + 1)) {
                    /**
                     * Ask for preference between this item and next
                     */
                    answer = await ask(
                        type[name][i].Title,
                        type[name][i + 1].Title
                    );

                    /**
                     * If preference was for the second item, re-sort and repeat
                     */
                    if (answer === 1) {
                        type[name] = sort(type[name]);
                        outputSorted();
                        i = -1;
                    }
                }
            }
        }
    }

    io.close();
}

/**
 * Parse ratings.csv downloaded from IMDb -> Your Ratings
 */
createReadStream(join(__dirname, "ratings.csv"))
    .pipe(csv())
    .on("data", data => results.push(data))
    .on("end", () => {
        /**
         * Sort by "Your Rating" then "IMDb Rating"
         */
        results = sort(results);

        /**
         * Group into "Title Type", i.e. movie, tvSeries, tvEpisode, etc.
         */
        results.forEach(rating => {
            if (
                !Object.prototype.hasOwnProperty.call(
                    type,
                    rating["Title Type"]
                )
            ) {
                type[rating["Title Type"]] = [];
            }
            type[rating["Title Type"]].push(rating);
        });

        /**
         * Call manual sorting code
         */
        main();
    });
