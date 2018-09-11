;($ => {
  /* globals $, _ */
  $(document).on('click', () => $('.collapse').collapse('hide'))
  const [y, m, d] = new Date()
    .toISOString()
    .slice(0, 10)
    .split('-')
  $('.consultedAt').text(`${d}/${m}/${y}`)
  $('.articleUrl').text(document.location)

  const goToSearch = evt => {
    if (evt.which !== 13) return // enter
    const $this = $(evt.currentTarget)
    document.location = `${$this.data('search-page-url')}/?q=${$this.val()}`
  }
  // TODO merge all 3
  $('#TopMenuPanel-search input').on('keypress', goToSearch)
  $('input.search-field').on('keypress', goToSearch)
  $('form.navmenu-form').on('submit', evt => evt.preventDefault())
  $('form.navmenu-form input').on('keypress', goToSearch)

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

    // TODO brittle solution
    // TODO i18n
    const updatePageTitle = () => {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.forEach((value, key) => {
        if (key !== 'types[]') return
        if (value === 'map') return setTitle('cartes et graphiques')
        if (value === 'image' || value === 'video')
          return setTitle('photos et vidéos')
        if (value === 'single-definition') return setTitle('lexique')
        if (value === 'reference') return setTitle('références')
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
        const values = searchParams.getAll(key)
        if ($input.is(':checkbox, :radio')) {
          const selector = values.map(valueSelector).join(',')
          const $inputs = $input.filter(selector)
          $inputs.prop('checked', true)
        } else if ($input.is('select[multiple]')) {
          $input.val(searchParams.getAll(key))
        } else {
          $input.val(searchParams.get(key))
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
      // Run query
      $.post($form.attr('data-api-url') || '/search', data).then(
        results => showSearchResults(results, formData),
        showSearchError,
      )
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
