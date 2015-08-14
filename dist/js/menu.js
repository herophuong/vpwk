jQuery(document).ready(function() {
	$menu = jQuery('#menu');
	$menu.on('click', function() {
		if ($menu.hasClass('btn-close')) {
			jQuery('#nav').removeClass('menu-open');
			jQuery('#wrap').removeClass('fixed');
			$menu.removeClass('btn-close');
		} else {
			jQuery('#nav').addClass('menu-open');
			jQuery('#wrap').addClass('fixed');
			$menu.addClass('btn-close');
		}
	});
});
