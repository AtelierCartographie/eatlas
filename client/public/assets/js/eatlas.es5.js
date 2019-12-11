'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

;(function ($) {
  /* globals _ */
  $(document).on('click', function () {
    return $('.collapse').collapse('hide');
  });

  var _toISOString$slice$sp = new Date().toISOString().slice(0, 10).split('-'),
      _toISOString$slice$sp2 = _slicedToArray(_toISOString$slice$sp, 3),
      y = _toISOString$slice$sp2[0],
      m = _toISOString$slice$sp2[1],
      d = _toISOString$slice$sp2[2];

  $('.consultedAt').text(d + '/' + m + '/' + y);
  $('.articleUrl').text(document.location);

  // Initialize Slick Carousel
  if ($.fn.slick) {
    var loadLazyImages = function loadLazyImages(slick) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : slick.currentSlide;

      var start = slick.$slides.length <= slick.options.slidesToShow ? 0 // All visible, start at 0, no special case
      : slick.options.centerMode // Center mode, we have negative indices
      ? index - Math.floor(slick.options.slidesToShow / 2) : index;
      for (var i = start; i < start + slick.options.slidesToShow; i++) {
        var $slide = slick.$slides.eq(i % slick.$slides.length);
        loadLazyImage($slide);
      }
    };
    var loadLazyImage = function loadLazyImage($slide) {
      var attr = 'data-lazy-background-image';
      var $image = $('.image[' + attr + ']', $slide);
      $image.each(function () {
        var src = this.getAttribute(attr);
        this.style.backgroundImage = 'url(' + src + ')';
      });
    };
    $(function () {
      $('.carousel').on('afterChange', function (e, slick, prev, next) {
        return loadLazyImages(slick, next);
      }).on('init', function (e, slick) {
        return loadLazyImages(slick);
      })
      // Replace initialSlide = `RAND${min}-${max}`
      .each(function () {
        if (this.getAttribute('data-slick')) {
          try {
            var data = JSON.parse(this.getAttribute('data-slick'));
            var match = null;
            if (data.initialSlide && typeof data.initialSlide === 'string' && (match = data.initialSlide.match(/^RAND(\d+)-(\d+)$/))) {
              var min = Number(match[1]);
              var max = Number(match[2]);
              data.initialSlide = min + Math.floor(Math.random() * (max - min));
              this.setAttribute('data-slick', JSON.stringify(data));
            }
          } catch (err) {
            window.console && window.console.error(err);
          }
        }
      }).slick({
        accessibility: true,
        // adaptiveHeight: false,
        // autoplay: false,
        // autoplaySpeed: 3000,
        // arrows: true,
        prevArrow: '<button role="button" class="slick-prev" title="' + window.CAROUSEL_PREVIOUS + '">' + window.CAROUSEL_PREVIOUS + '</button>',
        nextArrow: '<button role="button" class="slick-next" title="' + window.CAROUSEL_NEXT + '">' + window.CAROUSEL_NEXT + '</button>',
        // centerMode: false,
        // centerPadding: '50px',
        // cssEase: 'ease',
        dots: true,
        // draggable: true,
        fade: false,
        // infinite: true,
        // initialSlide: 0,
        // lazyLoad: 'ondemand',
        // mobileFirst: false,
        // responsive: null,
        // rows: 1,
        // slidesPerRow: 1,
        // slide: '',
        slidesToShow: 1
        // slidesToScroll: 1,
        // speed: 300,
        // swipe: true,
        // variableWidth: false,
        // zIndex: 1000,
      });
    });
  }

  var goToSearch = function goToSearch(evt) {
    if (evt.which !== 13) return; // enter
    var $this = $(evt.currentTarget);
    var location = $this.data('search-page-url') + '?q=' + $this.val();
    if (window.SEARCH_DEFAULT_LANG) {
      location += '&locales%5B%5D=' + window.SEARCH_DEFAULT_LANG;
    }
    document.location = location;
  };
  // Search inputs
  $('form.navmenu-form').on('submit', function (evt) {
    return evt.preventDefault();
  });
  $('#TopMenuPanel-search input, input.search-field, form.navmenu-form input').on('keypress', goToSearch);

  // Read more arrow in Footnotes and embedded resources comment
  $('.read-more').on('click', function () {
    var totalHeight = 0;
    var $parent = $(this).parent();

    $parent.find('ol, p').each(function () {
      totalHeight += $(this).outerHeight();
    });

    $parent.find('.masked').each(function () {
      totalHeight += $(this).outerHeight();
    });

    $parent.css({
      transition: '3s all ease',
      height: totalHeight,
      'max-height': 9999
    });

    $(this).css({ display: 'none' });
    return false;
  });

  // Search page
  if ($('.SearchPage').length) {
    var resultTpl = _.template($('.SearchPage .results-template').text());
    var $form = $('.SearchPage form');
    var currPage = null;

    var setTitle = function setTitle(title) {
      if (title) {
        $('.SearchPage').addClass('has-title');
        $('.SearchPageTitleType').text(title);
      } else {
        $('.SearchPage').removeClass('has-title');
        $('.SearchPageTitleType').text('');
      }
    };

    var setFiltersCount = function setFiltersCount(count) {
      return $('.SearchFiltersCount').text(count ? '(' + count + ')' : '');
    };

    var updatePageTitle = function updatePageTitle(types) {
      var titles = (types || []).map(function (t) {
        return window.SEARCH_PAGE_TITLE[t];
      }).filter(function (v) {
        return !!v;
      });
      if (!titles.length) titles.push(window.SEARCH_PAGE_TITLE.all);
      return setTitle(titles.join(', '));
    };

    // Pre-fill input from query string
    var valueSelector = function valueSelector(v) {
      return '[value="' + v + '"]';
    };
    var readFromUrl = function readFromUrl() {
      var searchParams = new URLSearchParams(window.location.search);
      updatePageTitle(searchParams.getAll('types[]'));
      Array.from(searchParams.keys()).forEach(function (key) {
        var $input = $('[name="' + key + '"]', $form);
        if (!$input.length) {
          return; // No matching filter
        }
        var open = false; // Open filters section if a filter is actually enabled
        if ($input.is(':checkbox, :radio')) {
          var selector = searchParams.getAll(key).map(valueSelector).join(',');
          var $inputs = $input.filter(selector);
          open = $inputs.length > 0;
          $inputs.prop('checked', true);
        } else if ($input.is('select[multiple]')) {
          var values = searchParams.getAll(key);
          $input.val(values);
          open = values.length > 0;
        } else {
          var value = searchParams.get(key);
          $input.val(value);
          open = !!value;
        }
        if (open) {
          $input.closest('.search-filters-inputs').prev().attr('data-filters-hidden', '0');
        }
      });
      currPage = Number(searchParams.get('page')) || 1;
    };
    readFromUrl();

    // Output
    var showSearchError = function showSearchError(data) {
      $('.SearchPage .SearchResults .search-results-error').text(data.message);
      $('.SearchPage .SearchResults').attr('data-status', 'error');
    };
    var showSearchResults = function showSearchResults(results, formData) {
      var types = formData.filter(function (fd) {
        return fd.name === 'types[]';
      });
      if (types.length === 1 && types[0].value === 'single-definition') {
        $('.SearchPage').addClass('is-lexicon');
      } else {
        $('.SearchPage').removeClass('is-lexicon');
      }
      try {
        $('.SearchPage .SearchResults .search-results-success').html(resultTpl({
          results: results,
          formData: formData,
          ui: {
            // no need to repeat the type each time in one-type-only results
            hideSearchResultsType: types.length === 1
          }
        }));
        $('.SearchPage .SearchResults').attr('data-status', 'success');
        showHideResultDefinitionTogglers();
        // only checkboxes for now
        setFiltersCount(formData.filter(function (fd) {
          return fd.name.endsWith('[]');
        }).length);
        var letter = formData.filter(function (fd) {
          return fd.name === 'letter';
        });
        showActiveLetter(letter.length === 1 ? letter[0].value : null);
      } catch (err) {
        showSearchError(err);
      }
    };

    // Throttle to avoid user double submit
    var search = _.throttle(function (updateUrl) {
      var data = $form.serialize() + '&page=' + currPage;
      var formData = $form.serializeArray();
      // Persist search parameters to URL
      if (updateUrl) {
        var qs = '?' + data;
        // Ignore duplicate URLs triggered by resubmitting same for or duplicate events
        if (qs !== window.location.search) {
          window.history.pushState({ search: true }, window.title, qs);
        }
      }
      // Update title from filters
      updatePageTitle(formData.filter(function (p) {
        return p.name === 'types[]';
      }).map(function (p) {
        return p.value;
      }));
      // Update URLs of language switcher
      $('.LangSelector .other').each(function () {
        var originalUrl = this.getAttribute('data-original-href');
        if (!originalUrl) {
          originalUrl = this.href;
          this.setAttribute('data-original-href', originalUrl);
        }
        if (originalUrl) {
          this.href = originalUrl + (originalUrl.match(/\?/) ? '&' : '?') + data;
        }
      });
      // Run query
      var xhr = new XMLHttpRequest();
      xhr.open('POST', $form.attr('data-api-url') || '/search', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          try {
            var json = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
              showSearchResults(json, formData);
            } else {
              showSearchError(json);
            }
          } catch (err) {
            showSearchError({ message: xhr.responseText });
          }
        }
      };
      xhr.send(data);
    }, 100);

    // Handle browser's back/forward
    window.addEventListener('popstate', function () {
      readFromUrl();
      search(false);
    });

    // Run search on submit or change
    var onSearch = function onSearch(preventDefault) {
      return function (e) {
        if (preventDefault) {
          e.preventDefault();
        }
        currPage = 1;
        search(true);
      };
    };
    $form.on('submit', onSearch(true));
    $form.on('change', onSearch(false));
    $form.on('reset', function () {
      return setTimeout(onSearch(false), 10);
    });

    // Expand/collapse filters
    $('.SearchPage .search-filters-toggle[data-filters-hidden]').on('click', function (e) {
      e.preventDefault();
      var $this = $(e.currentTarget);
      var current = $this.attr('data-filters-hidden');
      var next = current === '1' ? '0' : '1';
      $this.attr('data-filters-hidden', next);
      e.stopPropagation();
    });

    $('.SearchPage .search-filters label').on('click', function (e) {
      e.stopPropagation();
    });

    // Run initial search on load
    search(false);

    // Pagination
    $('.SearchPage').on('click', '.search-results-prev', function (e) {
      e.preventDefault();
      currPage = Math.max(1, currPage - 1);
      search(true);
    });
    $('.SearchPage').on('click', '.search-results-next', function (e) {
      e.preventDefault();
      currPage = currPage + 1;
      search(true);
    });

    // Enable auto-complete for keywords
    // $('select.keywords').selectize({
    //   create: false,
    //   highlight: true,
    //   dropdownParent: 'body',
    //   //maxOptions: 5,
    // })

    // Lexicon additional filter
    $('.SearchPage').on('click', '.search-filter-a-z', function (e) {
      var $this = $(e.currentTarget);
      if ($this.is('.active')) {
        $('[name=letter]').val('');
        showActiveLetter(null);
      } else {
        $('[name=letter]').val($this.data('letter'));
        showActiveLetter($this.data('letter'));
      }
      currPage = 1;
      search(true);
    });
    var showActiveLetter = function showActiveLetter(letter) {
      $('.search-filter-a-z.active').removeClass('active');
      if (letter) {
        $('.search-filter-a-z[data-letter="' + letter + '"]').addClass('active');
      }
    };

    // Wide-screen: filters container is always visible, fixed inside left margin
    // Detect this without trusting client width, but filters' actual positioning
    var repositionFiltersDropdown = function repositionFiltersDropdown() {
      // Cross-browser viewport width, see https://stackoverflow.com/a/11310353
      var screenWidth = window.innerWidth || (document.documentElement || document.body).clientWidth;
      var $dropdown = $('.SearchPage .search-filters.dropdown-menu');
      if (screenWidth >= 732) {
        // '@media (min-width: 732px)', see var.scss
        var $content = $('.SearchPage .SearchResults');
        var maxLeft = $content.offset().left - $dropdown.width();
        // If margin is wide enough, position dropdown right beside the content
        // Otherwise, css should have gone back to standard/mobile display
        if (maxLeft > 0) {
          $dropdown.css({ left: maxLeft + 'px', display: '' });
        }
      } else {
        $dropdown.css({ left: '' });
      }
    };
    repositionFiltersDropdown();
    $(window).on('resize', repositionFiltersDropdown); // also reposition on resize as it may change

    // Handle open/close search filters
    $('.search-filters-container .dropdown-toggle').on('click', function (e) {
      e.preventDefault();
      $('.search-filters-container .dropdown-menu').toggle();
      setTimeout(repositionFiltersDropdown, 50);
    });
  }

  // Shared code between search page and definitions list

  /* Structure:
    <div class="search-result-definition">
      <p><%= hit.extra.definition %></p>
    </div>
    <button class="search-result-definition-toggler">
      <span class="search-result-definition-toggler-label-expand">show more</span>
      <span style="display:none" aria-hidden class="search-result-definition-toggler-label-collapse">show less</span>
    </button>
  */

  // Hide "show more / show less" togglers when content is small enough
  var showHideResultDefinitionTogglers = function showHideResultDefinitionTogglers() {
    $('.search-result-definition > p').each(function () {
      var $p = $(this);
      var $div = $p.parent();
      if ($p.height() <= $div.height()) {
        // No need to expand
        $div.addClass('expanded').parent().find('.search-result-definition-toggler').attr('aria-hidden', true).hide();
      }
    });
  };

  // Handle click on "show more / show less" togglers
  var toggleSearchResultDefinition = function toggleSearchResultDefinition($toggler) {
    var $div = $toggler.prev();
    var expanded = $div.hasClass('expanded');
    if (expanded) {
      $div.removeClass('expanded');
      $toggler.find('.search-result-definition-toggler-label-expand').removeAttr('aria-hidden').show();
      $toggler.find('.search-result-definition-toggler-label-collapse').attr('aria-hidden', true).hide();
    } else {
      $div.addClass('expanded');
      $toggler.find('.search-result-definition-toggler-label-expand').attr('aria-hidden', true).hide();
      $toggler.find('.search-result-definition-toggler-label-collapse').removeAttr('aria-hidden').show();
    }
  };
  $('.SearchPage, .LexiconPage').on('click', '.search-result-definition-toggler', function (e) {
    e.preventDefault();
    var $toggler = $(e.currentTarget);
    toggleSearchResultDefinition($toggler);
  });
  // Shortcut: expand on click (no collapse, so we don't block the text selection or add conditions for links)
  $('.SearchPage, .LexiconPage').on('click', '.search-result-definition:not(.expanded)', function (e) {
    e.preventDefault();
    var $toggler = $(e.currentTarget).next();
    toggleSearchResultDefinition($toggler);
  });

  // Top bar search field
  $('.search-toggle-button').on('click', function (e) {
    $(e.currentTarget).attr('aria-expanded', 'true').attr('aria-hidden', 'true').parent().addClass('expand').find('.search-field').focus();
  });
  $('body').on('click', function (e) {
    if (!$(e.target).closest('.search-toggle.expand').length) {
      $('.search-toggle.expand').removeClass('expand');
      $('.search-toggle-button').attr('aria-expanded', 'false').removeAttr('aria-hidden');
    }
  });

  // navmenu (sidemenu) close button
  $('#navmenu').on('click', '.close-button', function (e) {
    e.preventDefault();
    $('#navmenu').offcanvas('hide');
  });
  $('#navmenu').on('shown.bs.offcanvas	', function () {
    $('[data-target="#navmenu"][data-label-close]').each(function () {
      var $this = $(this);
      $this.attr('aria-label', $this.attr('data-label-close')).attr('aria-expanded', 'true');
      $('#navmenu .close-button').attr('aria-expanded', 'true');
    });
  }).on('hidden.bs.offcanvas', function () {
    $('[data-target="#navmenu"][data-label-open]').each(function () {
      var $this = $(this);
      $this.attr('aria-label', $this.attr('data-label-open')).attr('aria-expanded', 'false');
      $('#navmenu .close-button').attr('aria-expanded', 'false');
    });
  });

  // Close menu on unfocus (kbd navigation)
  var closeTimeout = null;
  $(document.body).on('focusout', '#navmenu', function () {
    // unfocus a child element of #navmenu: but it can be to change focus
    // to another child, so don't act immediately
    closeTimeout = setTimeout(function () {
      return $('#navmenu').offcanvas('hide');
    }, 50);
  }).on('focus', '#navmenu', function () {
    // focus a child of #navmenu: cancel any pending close
    clearTimeout(closeTimeout);
  });

  // Top bar on scroll
  $(window).on('load resize scroll', function (e) {
    var scroll = $(window).scrollTop();
    var height = window.innerHeight;
    if (scroll / height > 0.7) {
      $('body').addClass('scrolled');
    } else {
      $('body').removeClass('scrolled');
    }
  });

  // #a11y Proper navigation when clicking on a definition in an article without style
  // Note: this handler is run *after* bootstrap collapse plugin
  var styledLexicon = true;
  $(document).on('click', '.LexiconLink[data-toggle="collapse"]', function (e) {
    var $this = $(e.currentTarget);
    var lexiconHeight = $('.Lexicon').height();
    var collapsed = $this.attr('aria-expanded') !== 'true';
    if (!collapsed) {
      // Expanded: animation just started, if height is 0 then it means we have active styling
      if (lexiconHeight > 10) {
        // Otherwise, a non neglictible height means no style, which means we should go to definition
        // instead of "expanding"
        styledLexicon = false;
      }
    } else {
      // Collapsed: hard to tell by style if we need to activate, so we just rely on previously set flag
    }
    if (!styledLexicon) {
      document.location.hash = $this.attr('href');
    }
  });

  // #a11y Adjust focus when working with lexicon definition dialog
  // Open definition = focus to definition title in dialog
  // Then press ESC = close
  // Close = close dialog and focus to link that opened the dialog initially
  $(document).on('click', '.LexiconLink:not([aria-expanded="true"])', function (e) {
    var $this = $(e.currentTarget);
    var $backNodeInArticle = $this;
    var $lexiconDialog = $($this.attr('href'));
    $lexiconDialog.find('a.lexicon-dialog-title').first().focus();
    $lexiconDialog.find('a.lexicon-dialog-close').removeAttr('aria-hidden');
    $lexiconDialog.one('hide.bs.collapse', function (e) {
      $backNodeInArticle.focus();
    });
  });
  $('.Lexicon > [role="dialog"]').on('keydown', function (e) {
    if (e.key === 'Escape') {
      $(e.currentTarget).collapse('hide');
    }
  });
  $('.Lexicon > [role="dialog"]').on('click', '.close', function (e) {
    $(e.currentTarget).collapse('hide');
  });
})(window.jQuery);