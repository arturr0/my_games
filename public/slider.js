$(document).ready(function () {
    let index = 1; // Initial section index
    const maxIndex = 2; // Maximum number of sections

    function updateSection() {
        if (index === 1) {
            $("#warcaby").addClass('view');
            $("#poker").removeClass('view');
        } else if (index === 2) {
            $("#warcaby").removeClass('view');
            $("#poker").addClass('view');
        }
    }

    function updateHref() {
        $(".arrow__btn").prop("href", `#section${index}`);
    }

    $(".left-arrow").click(function () {
        index--;
        if (index < 1) {
            index = maxIndex; // Wrap around to the last section
        }
        updateSection();
        updateHref();
    });

    $(".right-arrow").click(function () {
        index++;
        if (index > maxIndex) {
            index = 1; // Wrap around to the first section
        }
        updateSection();
        updateHref();
    });

    // Initial call to set the correct section and href
    updateSection();
    updateHref();

    $('#content').on('wheel mousedown', function (e) {
        if (e.button === 1 || e.type === 'wheel') {
            e.preventDefault();
            e.stopPropagation();
            return false; // Prevent middle mouse button and scroll behavior
        }
    });
    $('#content').on('wheel mouseup', function (e) {
        if (e.button === 1 || e.type === 'wheel') {
            e.preventDefault();
            e.stopPropagation();
            return false; // Prevent middle mouse button and scroll behavior
        }
    });
});
