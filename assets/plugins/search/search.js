summaryInclude = 100;
var fuseOptions = {
  isCaseSensitive: false,
  includeScore: false,
  shouldSort: true,
  includeMatches: true,
  findAllMatches: false,
  useExtendedSearch: true,
  minMatchCharLength: 5,
  location: 99999999,
  threshold: 0.01,
  ignoreLocation: false,
  ignoreFieldNorm: false,
  keys: [{
      name: "title",
      weight: 0.8
    },
    {
      name: "tags",
      weight: 0.5
    },
    {
      name: "categories",
      weight: 0.5
    },
    {
      name: "contents",
      weight: 0.3
    }
  ]
};

var searchQuery = '';
searchQuery = addToQuery(searchQuery, param("s")); // search box
searchQuery = addToQuery(searchQuery, param("p")); // pool
searchQuery = addToQuery(searchQuery, param("v")); // sea view
searchQuery = addToQuery(searchQuery, param("a")); // 50 - 100
searchQuery = addToQuery(searchQuery, param("b")); // 100 - 200
searchQuery = addToQuery(searchQuery, param("c")); // 200 - 300
searchQuery = addToQuery(searchQuery, param("d")); // salobrena
searchQuery = addToQuery(searchQuery, param("e")); // almunecar
searchQuery = addToQuery(searchQuery, param("f")); // la-herradura
searchQuery = addToQuery(searchQuery, param("g")); // garden
searchQuery = addToQuery(searchQuery, param("h")); // villa
searchQuery = addToQuery(searchQuery, param("i")); // townhouse
searchQuery = addToQuery(searchQuery, param("j")); // apartment
searchQuery = addToQuery(searchQuery, param("k")); // ruin
searchQuery = addToQuery(searchQuery, param("l")); // land
searchQuery = addToQuery(searchQuery, param("m")); // newbuild

// console.log('searchQuery ' + searchQuery);
if (searchQuery) {
  // $("#search-query").val(searchQuery);
  executeSearch(searchQuery , "No Match Found - Here are some close matches.");
}

searchQuery = '';
searchQuery = addToQueryOr(searchQuery, param("s")); // search box
searchQuery = addToQueryOr(searchQuery, param("p")); // pool
searchQuery = addToQueryOr(searchQuery, param("v")); // sea view
searchQuery = addToQueryOr(searchQuery, param("a")); // 50 - 100
searchQuery = addToQueryOr(searchQuery, param("b")); // 100 - 200
searchQuery = addToQueryOr(searchQuery, param("c")); // 200 - 300
searchQuery = addToQueryOr(searchQuery, param("d")); // salobrena
searchQuery = addToQueryOr(searchQuery, param("e")); // almunecar
searchQuery = addToQueryOr(searchQuery, param("f")); // la-herradura
searchQuery = addToQueryOr(searchQuery, param("g")); // garden
searchQuery = addToQueryOr(searchQuery, param("h")); // villa
searchQuery = addToQueryOr(searchQuery, param("i")); // townhouse
searchQuery = addToQueryOr(searchQuery, param("j")); // apartment
searchQuery = addToQueryOr(searchQuery, param("k")); // ruin
searchQuery = addToQueryOr(searchQuery, param("l")); // land
searchQuery = addToQueryOr(searchQuery, param("m")); // newbuild
// console.log('searchQuery OR ' + searchQuery);
if (searchQuery) {
  // $("#search-query").val(searchQuery);
  executeSearch(searchQuery , "No Match Found - Please simplify your search.");
}

function addToQuery(queryStr, param) {
  if (param != '') {
    if (queryStr === '') {
      queryStr = '\'' + param;
    } else {
      queryStr = queryStr  + ' \'' + param;
    }
  }
  return queryStr;
}

function addToQueryOr(queryStr, param) {
  if (param != '') {
    if (queryStr === '') {
      queryStr = '\'' + param;
    } else {
      queryStr = queryStr  + ' | \'' + param;
    }
  }
  return queryStr;
}

function executeSearch(searchQuery, noResults) {
  $.getJSON(indexURL, function (data) {
    var pages = data;
    var fuse = new Fuse(pages, fuseOptions);
    var result = fuse.search(searchQuery);

    // console.log({"matches":result});
    // console.log({"index":pages});
    if (result.length > 0) {
      populateResults(result);
      $('#search-results').append("<div class=\"text-center\"><h3>Similar Matches:</h3></div>");
    } else {
      $('#search-results').append("<div class=\"text-center\"><h3>" + noResults + "</h3></div>");
    }
  });
}

function populateResults(result) {
  $.each(result, function (key, value) {
    var contents = value.item.contents;
    var snippet = "";
    var snippetHighlights = [];
    if (fuseOptions.tokenize) {
      snippetHighlights.push(searchQuery);
    } else {
      $.each(value.matches, function (matchKey, mvalue) {
        if (mvalue.key === "tags" || mvalue.key === "categories") {
          snippetHighlights.push(mvalue.value);
        } 
        // remove content highlights
        /* else if (mvalue.key == "contents") {
          start = mvalue.indices[0][0] - summaryInclude > 0 ? mvalue.indices[0][0] - summaryInclude : 0;
          end = mvalue.indices[0][1] + summaryInclude < contents.length ? mvalue.indices[0][1] + summaryInclude : contents.length;
          snippet += contents.substring(start, end);
          snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0], mvalue.indices[0][1] - mvalue.indices[0][0] + 1));
        } */
      });
    }

    if (snippet.length < 1) {
      snippet += contents.substring(0, summaryInclude * 2);
    }
    //pull template from hugo templarte definition
    var templateDefinition = $('#search-result-template').html();
    //replace values
    var output = render(templateDefinition, {
      key: key,
      title: value.item.title,
      image: value.item.image,
      date: value.item.date,
      link: value.item.permalink,
      tags: value.item.tags,
      categories: value.item.categories,
      snippet: snippet
    });
    $('#search-results').append(output);

    $.each(snippetHighlights, function (snipkey, snipvalue) {
      $("#summary-" + key).mark(snipvalue);
    });
  });
}

function param(name) {
  return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function render(templateString, data) {
  var conditionalMatches, conditionalPattern, copy;
  conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
  //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
  copy = templateString;
  while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
    if (data[conditionalMatches[1]]) {
      //valid key, remove conditionals, leave contents.
      copy = copy.replace(conditionalMatches[0], conditionalMatches[2]);
    } else {
      //not valid, remove entire section
      copy = copy.replace(conditionalMatches[0], '');
    }
  }
  templateString = copy;
  //now any conditionals removed we can do simple substitution
  var key, find, re;
  for (key in data) {
    find = '\\$\\{\\s*' + key + '\\s*\\}';
    re = new RegExp(find, 'g');
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
}