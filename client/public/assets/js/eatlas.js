;($ => {
  /* globals _ */
  $(document).on('click', () => $('.collapse').collapse('hide'))
  const [y, m, d] = new Date()
    .toISOString()
    .slice(0, 10)
    .split('-')
  $('.consultedAt').text(`${d}/${m}/${y}`)
  $('.articleUrl').text(document.location)

  // Initialize Slick Carousel
  if ($.fn.slick) {
    $(() =>
      $('.carousel').slick({
        // accessibility: true,
        // adaptiveHeight: false,
        // autoplay: false,
        // autoplaySpeed: 3000,
        // arrows: true,
        prevArrow: '<div class="slick-prev">Previous</div>',
        nextArrow: '<div class="slick-next">Next</div>',
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
        slidesToShow: 1,
        // slidesToScroll: 1,
        // speed: 300,
        // swipe: true,
        // variableWidth: false,
        // zIndex: 1000,
      }),
    )
  }

  const goToSearch = evt => {
    if (evt.which !== 13) return // enter
    const $this = $(evt.currentTarget)
    document.location = `${$this.data('search-page-url')}?q=${$this.val()}`
  }
  // Search inputs
  $('form.navmenu-form').on('submit', evt => evt.preventDefault())
  $(
    '#TopMenuPanel-search input, input.search-field, form.navmenu-form input',
  ).on('keypress', goToSearch)

  // Read more arrow in Footnotes and embedded resources comment
  $('.read-more').on('click', function() {
    let totalHeight = 0
    const $parent = $(this).parent()

    $parent.find('ol, p').each(function() {
      totalHeight += $(this).outerHeight()
    })

    $parent.find('.masked').each(function() {
      totalHeight += $(this).outerHeight()
    })

    $parent
      .css({
        height: $parent.height(),
        'max-height': 9999,
      })
      .animate({
        height: totalHeight,
      })

    $(this).fadeOut()
    return false
  })

  // Search page
  if ($('.SearchPage').length) {
    const resultTpl = _.template($('.SearchPage .results-template').text())
    const $form = $('.SearchPage form')
    let currPage = null

    const setTitle = title => {
      if (title) {
        $('.SearchPage').addClass('has-title')
        $('.SearchPageTitleType').text(title)
      } else {
        $('.SearchPage').removeClass('has-title')
        $('.SearchPageTitleType').text('')
      }
    }

    const setFiltersCount = count =>
      $('.SearchFiltersCount').text(count ? `(${count})` : '')

    const updatePageTitle = () => {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.forEach((value, key) => {
        if (key !== 'types[]') return
        if (window.SEARCH_PAGE_TITLE[value]) {
          return setTitle(window.SEARCH_PAGE_TITLE[value])
        }
      })
    }
    // for links coming from the Footer
    updatePageTitle()

    // Pre-fill input from query string
    const valueSelector = v => `[value="${v}"]`
    const readFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search)
      Array.from(searchParams.keys()).forEach(key => {
        const $input = $(`[name="${key}"]`, $form)
        if (!$input.length) {
          return // No matching filter
        }
        let open = false // Open filters section if a filter is actually enabled
        if ($input.is(':checkbox, :radio')) {
          const selector = searchParams
            .getAll(key)
            .map(valueSelector)
            .join(',')
          const $inputs = $input.filter(selector)
          open = $inputs.length > 0
          $inputs.prop('checked', true)
        } else if ($input.is('select[multiple]')) {
          const values = searchParams.getAll(key)
          $input.val(values)
          open = values.length > 0
        } else {
          const value = searchParams.get(key)
          $input.val(value)
          open = !!value
        }
        if (open) {
          $input
            .closest('.search-filters-inputs')
            .prev()
            .attr('data-filters-hidden', '0')
        }
      })
      currPage = Number(searchParams.get('page')) || 1
    }
    readFromUrl()

    // Output
    const showSearchError = data => {
      $('.SearchPage .SearchResults .search-results-error').text(data.message)
      $('.SearchPage .SearchResults').attr('data-status', 'error')
    }
    const showSearchResults = (results, formData) => {
      const types = formData.filter(fd => fd.name === 'types[]')
      if (types.length === 1 && types[0].value === 'single-definition') {
        $('.SearchPage').addClass('is-lexicon')
      } else {
        $('.SearchPage').removeClass('is-lexicon')
      }
      try {
        $('.SearchPage .SearchResults .search-results-success').html(
          resultTpl({
            results,
            formData,
            ui: {
              // no need to repeat the type each time in one-type-only results
              hideSearchResultsType: types.length === 1,
            },
          }),
        )
        $('.SearchPage .SearchResults').attr('data-status', 'success')
        // only checkboxes for now
        setFiltersCount(formData.filter(fd => fd.name.endsWith('[]')).length)
        const letter = formData.filter(fd => fd.name === 'letter')
        showActiveLetter(letter.length === 1 ? letter[0].value : null)
      } catch (err) {
        showSearchError(err)
      }
    }

    // Throttle to avoid user double submit
    const search = _.throttle(updateUrl => {
      const data = $form.serialize() + '&page=' + currPage
      const formData = $form.serializeArray()
      // Persist search parameters to URL
      if (updateUrl) {
        const qs = `?${data}`
        // Ignore duplicate URLs triggered by resubmitting same for or duplicate events
        if (qs !== window.location.search) {
          window.history.pushState({ search: true }, window.title, qs)
        }
      }
      // Update URLs of language switcher
      $('.LangSelector .other').each(function() {
        let originalUrl = this.getAttribute('data-original-href')
        if (!originalUrl) {
          originalUrl = this.href
          this.setAttribute('data-original-href', originalUrl)
        }
        if (originalUrl) {
          this.href = originalUrl + (originalUrl.match(/\?/) ? '&' : '?') + data
        }
      })
      // Run query
      const xhr = new XMLHttpRequest()
      xhr.open('POST', $form.attr('data-api-url') || '/search', true)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const json = JSON.parse(xhr.responseText)
            if (xhr.status === 200) {
              showSearchResults(json, formData)
            } else {
              showSearchError(json)
            }
          } catch (err) {
            showSearchError({ message: xhr.responseText })
          }
        }
      }
      xhr.send(data)
    }, 100)

    // Handle browser's back/forward
    window.addEventListener('popstate', () => {
      readFromUrl()
      search(false)
    })

    // Run search on submit or change
    const onSearch = preventDefault => e => {
      if (preventDefault) {
        e.preventDefault()
      }
      currPage = 1
      search(true)
    }
    $form.on('submit', onSearch(true))
    $form.on('change', onSearch(false))
    $form.on('reset', () => setTimeout(onSearch(false), 10))

    // Expand/collapse filters
    $('.SearchPage .search-filters-toggle[data-filters-hidden]').on(
      'click',
      e => {
        e.preventDefault()
        const $this = $(e.currentTarget)
        const current = $this.attr('data-filters-hidden')
        const next = current === '1' ? '0' : '1'
        $this.attr('data-filters-hidden', next)
        e.stopPropagation()
      },
    )

    $('.SearchPage .search-filters label').on('click', e => {
      e.stopPropagation()
    })

    // Run initial search on load
    search(false)

    // Pagination
    $('.SearchPage').on('click', '.search-results-prev', e => {
      e.preventDefault()
      currPage = Math.max(1, currPage - 1)
      search(true)
    })
    $('.SearchPage').on('click', '.search-results-next', e => {
      e.preventDefault()
      currPage = currPage + 1
      search(true)
    })

    // Enable auto-complete for keywords
    $('select.keywords').selectize({
      create: false,
      highlight: true,
      dropdownParent: 'body',
      //maxOptions: 5,
    })

    // Lexicon additional filter
    $('.SearchPage').on('click', '.search-filter-a-z', e => {
      const $this = $(e.currentTarget)
      if ($this.is('.active')) {
        $('[name=letter]').val('')
        showActiveLetter(null)
      } else {
        $('[name=letter]').val($this.data('letter'))
        showActiveLetter($this.data('letter'))
      }
      currPage = 1
      search(true)
    })
    const showActiveLetter = letter => {
      $('.search-filter-a-z.active').removeClass('active')
      if (letter) {
        $(`.search-filter-a-z[data-letter="${letter}"]`).addClass('active')
      }
    }

    // Wide-screen: filters container is always visible, fixed inside left margin
    // Detect this without trusting client width, but filters' actual positioning
    const repositionFiltersDropdown = () => {
      const $dropdown = $('.SearchPage .search-filters.dropdown-menu')
      const $content = $('.SearchPage .SearchResults')
      const maxLeft = $content.offset().left - $dropdown.width()
      // If margin is wide enough, position dropdown right beside the content
      // Otherwise, css should have gone back to standard/mobile display
      if (maxLeft > 0) {
        $dropdown.css({ left: `${maxLeft}px` })
      }
    }
    repositionFiltersDropdown()
    $(window).on('resize', repositionFiltersDropdown) // also reposition on resize as it may change
  }

  // Shared code between search page and definitions list
  if ($('.SearchPage, .LexiconPage').length) {
    // Expand/collapse definitions
    $('.SearchPage, .LexiconPage').on(
      'click',
      '.search-result-definition a',
      e => {
        e.stopPropagation()
      },
    )
    $('.SearchPage, .LexiconPage').on(
      'click',
      '.search-result-definition',
      e => {
        e.preventDefault()
        $(e.currentTarget).toggleClass('expanded')
      },
    )
  }

  // Top bar search field
  $('.search-toggle-button').on('click', e => {
    $(e.currentTarget)
      .parent()
      .addClass('expand')
    $(e.currentTarget)
      .parent()
      .find('.search-field')
      .focus()
  })
  $('body').on('click', e => {
    if (!$(e.target).closest('.search-toggle.expand').length) {
      $('.search-toggle.expand').removeClass('expand')
    }
  })

  // navmenu (sidemenu) close button
  $('#navmenu').on('click', '.close-button', e => {
    e.preventDefault()
    $('#navmenu').offcanvas('hide')
  })

  // Top bar on scroll
  $(window).on('load resize scroll', e => {
    const scroll = $(window).scrollTop()
    const height = window.innerHeight
    if (scroll / height > 0.7) {
      $('body').addClass('scrolled')
    } else {
      $('body').removeClass('scrolled')
    }
  })
})(window.jQuery)
