// For RGB / global segmentation results
var video_width = 779;
const VIDEO_ASPECT_RATIO = 779 / 518;
var video_names = ["room", "room_edit"];
    
var videos = [];
var current_video_idx = 0;

function load_videos() {
  for (var i = 0; i < video_names.length; i++) {
    videos.push(document.getElementById(video_names[i])); 
  }
}

window.onload = function() {
  resize_canvas();
  const root = videos[1]
  const checkbox = document.getElementById('opacity-toggle')

  load_videos();
  checkbox.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      // root.style.setProperty("--opacity", `100%`);
      current_video_idx = 0;
    } else {
      // root.style.setProperty("--opacity", `0%`);
      current_video_idx = 1;
    }
  })

  // const checkbox = document.getElementById('opacity-toggle')

  // load_videos();
  // checkbox.addEventListener('change', (event) => {
  //   if (event.currentTarget.checked) {
  //     current_video_idx = 0;
  //     videos[1].style.setProperty("--opacity", `100%`);
  //   } else {
  //     current_video_idx = 1;
  //     videos[1].style.setProperty("--opacity", `0%`);
  //   }
  // })
  load_videos();
  videos[0].play();
  videos[1].play();
}

/* Synchronize main_results, and its canvas(es) to have the same size. */
function resize_canvas() {
  var main_results = document.getElementById('image-compare-canvas');
  var width = main_results.offsetWidth;

  var height = width / VIDEO_ASPECT_RATIO;
  main_results.height = height;
  main_results.style.height = height;

  video_width = width;

  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width;
  canvas.style.height = height;
}

// Need to trigger a `resize` when window size changes. 
// In particular, need to do resize after content loaded, to define height of the canvas!
// Otherwise, the canvas for main-results display won't work.
window.addEventListener('resize', resize_canvas, false);
document.addEventListener("DOMContentLoaded", function() { resize_canvas(); });

/* Image compare utility. Requires jquery + tabler-icons. */
$(() => {
  $(".image-compare").each((_index, parent) => {
    const $parent = $(parent);
    const before = $parent.data("before-label") || "Before";
    const after = $parent.data("after-label") || "After";
    $parent.append(
      "<div id='image-compare-handle' class='image-compare-handle'><i class='ti ti-arrows-horizontal'></i></div>" +
        "<div id='image-compare-before' class='image-compare-before'><div>" +
        before +
        "</div></div>" +
        "<div id='image-compare-after' class='image-compare-after'><div>" +
        after +
        "</div></div>",
    );
  });

  setInterval(() => {
    $(".image-compare").each((_index, parent) => {
      const $parent = $(parent);
      const $handle = $parent.children(".image-compare-handle");

      const currentLeft = $handle.position().left;

      // Linear dynamics + PD controller : - )
      const Kp = 0.03;
      const Kd = 0.2;

      let velocity = $parent.data("velocity") || 0;
      let targetLeft = $parent.data("targetX");
      if (targetLeft !== undefined) {
        const padding = 10;
        const parentWidth = $parent.width();
        if (targetLeft <= padding) targetLeft = 0;
        if (targetLeft >= parentWidth - padding) targetLeft = parentWidth;

        const delta = targetLeft - currentLeft;
        velocity += Kp * delta;
      }
      velocity -= Kd * velocity;

      // Update velocity.
      $parent.data("velocity", velocity);

      const newLeft = currentLeft + velocity;
      $parent.children(".image-compare-handle").css("left", newLeft + "px");
      $parent.children(".image-compare-before").width(newLeft + "px");
      // $parent.children("img:not(:first-child)").width(newLeft + "px");

      // $parent.children(".image-compare-after").style.right = 0;
      $parent.children(".image-compare-after").css("left", newLeft + "px");
      $parent.children(".image-compare-after").width(video_width - newLeft + "px");

      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');

      if (videos.length == 0) load_videos();

      const newLeftVideo = newLeft * 779 / video_width;
      video = videos[current_video_idx];

      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      ctx.drawImage(
        video, 
        0, 0, newLeftVideo, 518,
        0, 0, newLeft, video_width/VIDEO_ASPECT_RATIO
        );  // RGB
      ctx.drawImage(
        video,
        779+newLeftVideo, 0, 779-newLeftVideo, 518, newLeft, 
        0, video_width-newLeft, video_width/VIDEO_ASPECT_RATIO
        ); // Segmentation
    });
  }, 10);

  $(".image-compare").bind("mousedown touchstart", (evt) => {
    const $parent = $(evt.target.closest(".image-compare"));
    $parent.data("dragging", true);

    if (evt.type == "mousedown")
      $parent.data("targetX", evt.pageX - $parent.offset().left);
    else if (evt.type == "touchstart")
      $parent.data("targetX", evt.touches[0].pageX - $parent.offset().left);
  });

  $(document)
    .bind("mouseup touchend", () => {
      $(".image-compare").each((_index, parent) => {
        $(parent).data("dragging", false);
      });
    })
    .bind("mousemove touchmove", (evt) => {
      $(".image-compare").each((_index, parent) => {
        const $parent = $(parent);
        if (!$parent.data("dragging")) return;

        if (evt.type == "mousemove")
          $parent.data("targetX", evt.pageX - $parent.offset().left);
        else if (evt.type == "touchmove")
          $parent.data("targetX", evt.touches[0].pageX - $parent.offset().left);
      });
    });
}, 1000 / 60);  // 30fps

function set_play_pause_icon() {
  button = document.getElementById('play-btn')
  current_video = videos[current_video_idx]
  if (current_video.paused) {
    button.classList.remove("fa-pause");
    button.classList.add("fa-play");
  } else {
    button.classList.add("fa-pause");
    button.classList.remove("fa-play");
  }
}

function play_pause() {
  current_video = videos[current_video_idx]
  if (current_video.paused) {
    current_video.play();
  } else {
    current_video.pause();
  }
  set_play_pause_icon();
}