;(function() {
  /* globals $, _ */
  $(document).on('click', function() {
    $('.collapse').collapse('hide')
  })
  const [y, m, d] = new Date()
    .toISOString()
    .slice(0, 10)
    .split('-')
  $('.consultedAt').text(`${d}/${m}/${y}`)
  $('.articleUrl').text(document.location)

  // TODO Search page
})()
