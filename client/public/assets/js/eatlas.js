;(() => {
  /* globals $, _ */
  $(document).on('click', () => $('.collapse').collapse('hide'))
  const [y, m, d] = new Date()
    .toISOString()
    .slice(0, 10)
    .split('-')
  $('.consultedAt').text(`${d}/${m}/${y}`)
  $('.articleUrl').text(document.location)

  // Search page
  if ($('.SearchPage').length) {
    const resultTpl = _.template($('.SearchPage .results-template').text())
    const $form = $('.SearchPage form')

    // Pre-fill input from query string
    const foundQ = document.location.search.match(/[?&]q=(.+?)(?:[?&]|$)/)
    if (foundQ) {
      $('input[name=q]', $form).val(foundQ[1])
    }

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
    let currPage = null
    const search = _.throttle(page => {
      currPage = page
      $.post(
        $form.attr('data-api-url') || '/search',
        $form.serialize() + '&page=' + page,
      ).then(showSearchResults, showSearchError)
    }, 100)

    // Run search on submit or change
    const onSearch = e => {
      e.preventDefault()
      search(1)
    }
    $form.on('submit', onSearch)
    $('input, select, textarea', $form).on('change', onSearch)

    // Expand/collapse filters
    $('.SearchPage .search-filters-toggle[data-filters-hidden]').on(
      'click',
      e => {
        e.preventDefault()
        const $this = $(e.currentTarget)
        const current = $this.attr('data-filters-hidden')
        const next = current === '1' ? '0' : '1'
        $this.attr('data-filters-hidden', next)
      },
    )

    // Initialize search if there is pre-filled input
    if ($('input[name=q]', $form).val()) {
      search(1)
    }

    // Pagination
    $('.SearchPage').on('click', '.search-results-prev', e => {
      e.preventDefault()
      search(Math.max(1, currPage - 1))
    })
    $('.SearchPage').on('click', '.search-results-next', e => {
      e.preventDefault()
      search(currPage + 1)
    })
  }
})()
