# IMDb Ratings

## Description

IMDb allows you to rate movies, TV series, TV episodes, TV mini series on a 1 to 10 scale.  
I wrote this script to allow manual item-by-item sorting of each rating you've given.

Currently this is just a simple CLI interface to get preferences and automatically re-sort.  
In the future I'd like to add a graphic interface, preferable with cover images of the items.

## Usage

1. Download "ratings.csv"
    1. Navigate to [IMDb](https://www.imdb.com)
    2. Click your username in the top right
    3. Select "Your Ratings"
    4. Click the three dots on the right of "Your Ratings"
    5. Select "Export"
    6. Save "`ratings.csv`" into the same directory as "`index.js`"
2. Type in the console, "`node .`" to run "`index.js`"
3. Follow the prompts, answering "1" or "2" for your preference
