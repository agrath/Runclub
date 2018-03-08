jQuery(document).ready(function () {
    window.setInterval(function () {
        jQuery('a.gallery-box:not(.initialized)').colorbox({ maxWidth: '90%', maxHeight: '90%' }).addClass("initialized");
        jQuery('.dropdown-toggle:not(.initialized)')
            .dropdown()
            .addClass('initialized');
        $(document.body).on({
            "shown.bs.dropdown": function () { this.closable = true; },
            "hide.bs.dropdown": function () { return this.closable; },
            "click": function (e) {
                var c = !$(e.target).closest(".dropdown-menu").length;
                this.closable = c;
                window.setTimeout((function () {
                    this.closable = true;
                }).bind(this), 250)
            },
        }, ".dropdown.keepopen");

        jQuery('.tipTip:not(.initialized').tipTip().addClass('initialized');
    }, 250);

    jQuery('.siteButton').addClass('btn btn-dark btn-xl sr-button');

    jQuery('.page-scroll').on('click', function (e) {
        e.preventDefault();
        jQuery(window).scrollTo(jQuery('#scrollAnchor'), 400, { offset: -20 });
    });

    jQuery('.backToTopButton').on('click', function (e) {
        e.preventDefault();
        jQuery(window).scrollTo(jQuery('#page-top'), 400);
    });

    if (jQuery(window).width() < 768) {
        var navScroller = jQuery('.navbar .navMenu');
        navScroller.css('visibility', 'hidden');
        window.setTimeout(function () {
            navScroller.css('visibility', 'visible');
        }, 500);
        var windowHeight = jQuery(window).height() - 88;
        jQuery('.burgerButton').on('click', function () {
            navScroller.toggleClass('display');
            if (navScroller.hasClass('display')) {
                navScroller.css('transform', 'translateY(0)');
            }
            else {
                navScroller.css('transform', 'translateY(-' + windowHeight + 'px)');
            }
        });
        navScroller.css('max-height', windowHeight);
        navScroller.css('transform', 'translateY(-' + windowHeight + 'px)');
    }

    jQuery(window).on('scroll', function () {
        var $window = jQuery(window),
            scrolled = jQuery(window).scrollTop(),
            scrollDistance = 40;
        if ($window.width() > 767) {
            // hide
            jQuery('.siteLogo:not(.animated)').each(function () {
                var $this = jQuery(this);
                if (scrolled >= scrollDistance) {
                    $this.addClass('animated');
                }
            });
            // show
            jQuery('.siteLogo.animated').each(function (index) {
                var $this = jQuery(this);
                if (scrolled < scrollDistance) {
                    jQuery(this).removeClass('animated');
                }
            });
        }
    });
});