;(() => {
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
  $('.HomePage input').on('keypress', goToSearch)
  $('form.navmenu-form').on('submit', evt => evt.preventDefault())
  $('form.navmenu-form input').on('keypress', goToSearch)
  // Read more arrow in Footnotes
  $('.read-more').on('click', function() {
    let totalHeight = 0
    const $parent = $(this).parent()

    $parent.find('ol').each(function() {
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

    // Pre-fill input from query string
    const readFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.forEach((value, key) => {
        const $input = $(`input[name="${key}"]`, $form)
        if ($input.is(':checkbox, :radio')) {
          $input.filter(`[value="${value}"]`).prop('checked', true)
        } else {
          $input.val(value)
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
    const showSearchResults = results => {
      try {
        $('.SearchPage .SearchResults .search-results-success').html(
          resultTpl({ results }),
        )
        $('.SearchPage .SearchResults').attr('data-status', 'success')
      } catch (err) {
        showSearchError(err)
      }
    }

    // Throttle to avoid user double submit
    const search = _.throttle(updateUrl => {
      const data = $form.serialize() + '&page=' + currPage
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
        showSearchResults,
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
      search(1)
    }
    $form.on('submit', onSearch(true))
    $form.on('change', onSearch(false))

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

    // Expand/collapse definitions
    $('.SearchPage').on('click', '.search-result-definition', e => {
      e.preventDefault()
      $(e.currentTarget).toggleClass('expanded')
    })
  }
})()
