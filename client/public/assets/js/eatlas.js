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
      $('.SearchResults .search-results-error').text(data.message)
      $('.SearchResults').attr('data-status', 'error')
    }
    const showSearchResults = results => {
      try {
        $('.SearchResults .search-results-success').html(resultTpl({ results }))
        $('.SearchResults').attr('data-status', 'success')
      } catch (err) {
        showSearchError(err)
      }
    }

    // Throttle to avoid user double submit
    const search = _.throttle(() => {
      $.post($form.attr('data-api-url') || '/search', $form.serialize()).then(
        showSearchResults,
        showSearchError,
      )
    }, 100)

    // Run search on submit or change
    $form.on('submit', e => {
      e.preventDefault()
      search()
    })
    $('input, select, textarea', $form).on('change', e => {
      search()
    })

    // Expand/collapse filters
    $('.search-filters-toggle[data-filters-hidden]').on('click', e => {
      e.preventDefault()
      const $this = $(e.currentTarget)
      const current = $this.attr('data-filters-hidden')
      console.log({ current })
      const next = current === '1' ? '0' : '1'
      $this.attr('data-filters-hidden', next)
    })

    // Initialize search if there is pre-filled input
    if ($('input[name=q]', $form).val()) {
      search()
    }
  }
})()
