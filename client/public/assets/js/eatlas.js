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
    const loadLazyImages = (slick, index = slick.currentSlide) => {
      const start =
        slick.$slides.length <= slick.options.slidesToShow
          ? 0 // All visible, start at 0, no special case
          : slick.options.centerMode // Center mode, we have negative indices
          ? index - Math.floor(slick.options.slidesToShow / 2)
          : index
      for (let i = start; i < start + slick.options.slidesToShow; i++) {
        const $slide = slick.$slides.eq(i % slick.$slides.length)
        loadLazyImage($slide)
      }
    }
    const loadLazyImage = $slide => {
      const attr = 'data-lazy-background-image'
      const $image = $(`.image[${attr}]`, $slide)
      $image.each(function() {
        const src = this.getAttribute(attr)
        this.style.backgroundImage = `url(${src})`
      })
    }
    $(() => {
      $('.carousel')
        .on('afterChange', (e, slick, prev, next) =>
          loadLazyImages(slick, next),
        )
        .on('init', (e, slick) => loadLazyImages(slick))
        // Replace initialSlide = `RAND${min}-${max}`
        .each(function() {
          if (this.getAttribute('data-slick')) {
            try {
              const data = JSON.parse(this.getAttribute('data-slick'))
              let match = null
              if (
                data.initialSlide &&
                typeof data.initialSlide === 'string' &&
                (match = data.initialSlide.match(/^RAND(\d+)-(\d+)$/))
              ) {
                const min = Number(match[1])
                const max = Number(match[2])
                data.initialSlide =
                  min + Math.floor(Math.random() * (max - min))
                this.setAttribute('data-slick', JSON.stringify(data))
              }
            } catch (err) {
              window.console && window.console.error(err)
            }
          }
        })
        .slick({
          accessibility: true,
          // adaptiveHeight: false,
          // autoplay: false,
          // autoplaySpeed: 3000,
          // arrows: true,
          prevArrow: `<button role="button" class="slick-prev" title="${window.CAROUSEL_PREVIOUS}">${window.CAROUSEL_PREVIOUS}</button>`,
          nextArrow: `<button role="button" class="slick-next" title="${window.CAROUSEL_NEXT}">${window.CAROUSEL_NEXT}</button>`,
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
        })
    })
  }

  const goToSearch = evt => {
    if (evt.which !== 13) return // enter
    const $this = $(evt.currentTarget)
    let location = `${$this.data('search-page-url')}?q=${$this.val()}`
    if (window.SEARCH_DEFAULT_LANG) {
      location += `&locales%5B%5D=${window.SEARCH_DEFAULT_LANG}`
    }
    document.location = location
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

    $parent.css({
      transition: '3s all ease',
      height: totalHeight,
      'max-height': 9999,
    })

    $(this).css({ display: 'none' })
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

    const updatePageTitle = types => {
      const titles = (types || [])
        .map(t => window.SEARCH_PAGE_TITLE[t])
        .filter(v => !!v)
      if (!titles.length) titles.push(window.SEARCH_PAGE_TITLE.all)
      return setTitle(titles.join(', '))
    }

    // Pre-fill input from query string
    const valueSelector = v => `[value="${v}"]`
    const readFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search)
      updatePageTitle(searchParams.getAll('types[]'))
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
        showHideResultDefinitionTogglers()
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
      // Update title from filters
      updatePageTitle(
        formData.filter(p => p.name === 'types[]').map(p => p.value),
      )
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
        $this.attr('aria-expanded', next === '1' ? 'false' : 'true')
        e.stopPropagation() // avoid upper click…
        clearTimeout(closeFiltersTimeout) // … but this can break focus/focusout rule, so cancel it if applicable
      },
    )
    // Handling aria-expanded
    // Event "shown.bs.dropdown" should work, but for some reason it didn't
    // Note: this could be generalized, but it's the first time I need this hack so for now I keep it unique
    $('.SearchPage [data-toggle][aria-controls="search-filters-popup"]').on(
      'click',
      e => {
        // Let time for the target to change state
        setTimeout(
          () =>
            $(e.currentTarget).attr(
              'aria-expanded',
              $('#search-filters-popup').is(':visible') ? 'true' : 'false',
            ),
          100,
        )
      },
    )

    // Close filters on unfocus (kbd navigation)
    let closeFiltersTimeout = null
    $(document.body)
      .on('focusout', '#search-filters-popup', () => {
        // unfocus a child element of #search-filters-popup: but it can be to change focus
        // to another child, so don't act immediately
        closeFiltersTimeout = setTimeout(
          () =>
            $(
              '.SearchPage [data-toggle][aria-controls="search-filters-popup"]',
            ).trigger('click'),
          50,
        )
      })
      .on('focus click', '#search-filters-popup', () => {
        // focus a child of #search-filters-popup: cancel any pending close
        clearTimeout(closeFiltersTimeout)
      })
      .on('click', e => {
        if (
          $('#search-filters-popup').is(':visible') &&
          // disabled in desktop mode when toggle button is not visible
          $('[data-toggle][aria-controls="search-filters-popup"]').is(
            ':visible',
          )
        ) {
          const $this = $(e.target)
          if (
            $this.closest('[data-toggle][aria-controls="search-filters-popup"]')
              .length === 0 &&
            $this.closest('#search-filters-popup').length === 0
          ) {
            // hide
            e.preventDefault()
            $(
              '.SearchPage [data-toggle][aria-controls="search-filters-popup"]',
            ).trigger('click')
          }
        }
      })

    $('.SearchPage .search-filters label').on('click', e => {
      e.stopPropagation()
      clearTimeout(closeFiltersTimeout) // prevent focusout mess when stopping propagation
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
    // $('select.keywords').selectize({
    //   create: false,
    //   highlight: true,
    //   dropdownParent: 'body',
    //   //maxOptions: 5,
    // })

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
      // Cross-browser viewport width, see https://stackoverflow.com/a/11310353
      const screenWidth =
        window.innerWidth ||
        (document.documentElement || document.body).clientWidth
      const $dropdown = $('.SearchPage .search-filters.dropdown-menu')
      if (screenWidth >= 732) {
        // '@media (min-width: 732px)', see var.scss
        const $content = $('.SearchPage .SearchResults')
        const maxLeft = $content.offset().left - $dropdown.width()
        // If margin is wide enough, position dropdown right beside the content
        // Otherwise, css should have gone back to standard/mobile display
        if (maxLeft > 0) {
          $dropdown.css({ left: `${maxLeft}px`, display: '' })
        }
      } else {
        $dropdown.css({ left: '' })
      }
    }
    repositionFiltersDropdown()
    $(window).on('resize', repositionFiltersDropdown) // also reposition on resize as it may change

    // Handle open/close search filters
    $('.search-filters-container .dropdown-toggle').on('click', e => {
      e.preventDefault()
      $('.search-filters-container .dropdown-menu').toggle()
      setTimeout(repositionFiltersDropdown, 50)
    })
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
  const showHideResultDefinitionTogglers = () => {
    $('.search-result-definition > p').each(function() {
      const $p = $(this)
      const $div = $p.parent()
      if ($p.height() <= $div.height()) {
        // No need to expand
        $div
          .addClass('expanded')
          .parent()
          .find('.search-result-definition-toggler')
          .attr('aria-hidden', true)
          .hide()
      }
    })
  }

  // Handle click on "show more / show less" togglers
  const toggleSearchResultDefinition = $toggler => {
    const $div = $toggler.prev()
    const expanded = $div.hasClass('expanded')
    if (expanded) {
      $div.removeClass('expanded')
      $toggler
        .find('.search-result-definition-toggler-label-expand')
        .removeAttr('aria-hidden')
        .show()
      $toggler
        .find('.search-result-definition-toggler-label-collapse')
        .attr('aria-hidden', true)
        .hide()
    } else {
      $div.addClass('expanded')
      $toggler
        .find('.search-result-definition-toggler-label-expand')
        .attr('aria-hidden', true)
        .hide()
      $toggler
        .find('.search-result-definition-toggler-label-collapse')
        .removeAttr('aria-hidden')
        .show()
    }
  }
  $('.SearchPage, .LexiconPage').on(
    'click',
    '.search-result-definition-toggler',
    e => {
      e.preventDefault()
      const $toggler = $(e.currentTarget)
      toggleSearchResultDefinition($toggler)
    },
  )
  // Shortcut: expand on click (no collapse, so we don't block the text selection or add conditions for links)
  $('.SearchPage, .LexiconPage').on(
    'click',
    '.search-result-definition:not(.expanded)',
    e => {
      e.preventDefault()
      const $toggler = $(e.currentTarget).next()
      toggleSearchResultDefinition($toggler)
    },
  )

  // Top bar search field
  $('.search-toggle-button').on('click', e => {
    $(e.currentTarget)
      .attr('aria-expanded', 'true')
      .attr('aria-hidden', 'true')
      .parent()
      .addClass('expand')
      .find('.search-field')
      .focus()
  })
  $('body').on('click', e => {
    if (!$(e.target).closest('.search-toggle.expand').length) {
      $('.search-toggle.expand').removeClass('expand')
      $('.search-toggle-button')
        .attr('aria-expanded', 'false')
        .removeAttr('aria-hidden')
    }
  })

  // navmenu (sidemenu) close button
  $('#navmenu').on('click', '.close-button', e => {
    e.preventDefault()
    $('#navmenu').offcanvas('hide')
  })
  $('#navmenu')
    .on('shown.bs.offcanvas', () => {
      $('[data-target="#navmenu"][data-label-close]').each(function() {
        const $this = $(this)
        $this
          .attr('aria-label', $this.attr('data-label-close'))
          .attr('aria-expanded', 'true')
        $('#navmenu .close-button').attr('aria-expanded', 'true')
      })
    })
    .on('hidden.bs.offcanvas', () => {
      $('[data-target="#navmenu"][data-label-open]').each(function() {
        const $this = $(this)
        $this
          .attr('aria-label', $this.attr('data-label-open'))
          .attr('aria-expanded', 'false')
        $('#navmenu .close-button').attr('aria-expanded', 'false')
      })
    })

  // Close menu on unfocus (kbd navigation)
  let closeTimeout = null
  $(document.body)
    .on('focusout', '#navmenu', () => {
      // unfocus a child element of #navmenu: but it can be to change focus
      // to another child, so don't act immediately
      closeTimeout = setTimeout(() => $('#navmenu').offcanvas('hide'), 50)
    })
    .on('focus click', '#navmenu', () => {
      // focus a child of #navmenu: cancel any pending close
      clearTimeout(closeTimeout)
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

  // #a11y Proper navigation when clicking on a definition in an article without style
  // Note: this handler is run *after* bootstrap collapse plugin
  let styledLexicon = true
  $(document).on('click', '.LexiconLink[data-toggle="collapse"]', e => {
    const $this = $(e.currentTarget)
    const lexiconHeight = $('.Lexicon').height()
    const collapsed = $this.attr('aria-expanded') !== 'true'
    if (!collapsed) {
      // Expanded: animation just started, if height is 0 then it means we have active styling
      if (lexiconHeight > 10) {
        // Otherwise, a non neglictible height means no style, which means we should go to definition
        // instead of "expanding"
        styledLexicon = false
      }
    } else {
      // Collapsed: hard to tell by style if we need to activate, so we just rely on previously set flag
    }
    if (!styledLexicon) {
      document.location.hash = $this.attr('href')
    }
  })

  // #a11y Adjust focus when working with lexicon definition dialog
  // Open definition = focus to definition title in dialog
  // Then press ESC = close
  // Close = close dialog and focus to link that opened the dialog initially
  $(document).on('click', '.LexiconLink:not([aria-expanded="true"])', e => {
    const $this = $(e.currentTarget)
    const $backNodeInArticle = $this
    const $lexiconDialog = $($this.attr('href'))
    $lexiconDialog
      .find('a.lexicon-dialog-title')
      .first()
      .focus()
    $lexiconDialog.find('a.lexicon-dialog-close').removeAttr('aria-hidden')
    $lexiconDialog.one('hide.bs.collapse', e => {
      $backNodeInArticle.focus()
    })
  })
  $('.Lexicon > [role="dialog"]').on('keydown', e => {
    if (e.key === 'Escape') {
      $(e.currentTarget).collapse('hide')
    }
  })
  $('.Lexicon > [role="dialog"]').on('click', '.close', e => {
    $(e.currentTarget).collapse('hide')
  })

  // Control HomeVideo
  const $video = $('.HomeVideo video')
  if ($video.length > 0) {
    const video = $video.get(0)
    $('.HomeVideo')
      .on('mouseover', () => $('.HomeVideoController').addClass('hover'))
      .on('mouseout', () => $('.HomeVideoController').removeClass('hover'))
    $('.HomeVideo, .HomeVideoController').on('click', () =>
      video.paused ? video.play() : video.pause(),
    )
    $video
      .on('play', () => {
        const $ctrl = $('.HomeVideoController')
        $ctrl
          .removeClass('paused')
          .addClass('playing')
          .attr('title', $ctrl.attr('data-label-pause'))
          .attr('aria-label', $ctrl.attr('data-label-pause'))
        $ctrl.find('.iconPlay').removeAttr('aria-hidden')
        $ctrl.find('.iconPause').attr('aria-hidden', 'true')
      })
      .on('pause', () => {
        const $ctrl = $('.HomeVideoController')
        $ctrl
          .addClass('paused')
          .removeClass('playing')
          .attr('title', $ctrl.attr('data-label-play'))
          .attr('aria-label', $ctrl.attr('data-label-play'))
        $ctrl.find('.iconPlay').attr('aria-hidden', 'true')
        $ctrl.find('.iconPause').removeAttr('aria-hidden')
      })
  }

  // Intercept click on erroneous URL and show a warning
  $(document.body).on('click', 'a', e => {
    const href = e.currentTarget.getAttribute('href')
    if (href && href.match(/^#ERROR_/)) {
      if (confirm(window.WARNING_URL_ERROR.replace(/CODE/, href))) {
        e.preventDefault()
        window.open(window.CONTACT_URL, '_blank')
      }
    }
  })
})(window.jQuery)
