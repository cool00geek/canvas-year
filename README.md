# Canvas Year in Review

A browser extension designed to help you get an overview of your educational experience on the online learning system, Canvas.

## Inspiration

Due to the recent COVID-19 pandemic, all of our classes have been forced online. Many of our classes are conducted through the online learning platform Canvas, which is a platform for universities to centralize their learning systems and resources for each course.

## What it does

Canvas Year in Review analyzes all of your assignment submissions and generates statistics including total number of assignments assigned, total number of submissions, total number of late assignments, total missing assignments, total number of assignments submitted less than 30 minutes before the due date, average grades across assignments, and average grades across all courses.

It then displays this information in an attractive dashboard, along with color coding (Green, Yellow, Red) in order to gauge your performance in each of these metrics.

## How we built it

We used Javascript for the majority of this extension using the WebExtensions framework. However, we also wrote the UI in HTML and CSS. We used [Bulma CSS](https://bulma.io/) to style the UI elements.

We used the [Canvas API](https://canvas.instructure.com/doc/api/) to fetch courses and assignments from Canvas, and we ran analytics locally on this data.

## Accomplishments that we're proud of

We're proud of our user interface, because this was one of the first time that we made a user interface for a hackathon project that we thought looked great. Bulma CSS and the built in components and UI elements for it made this extremely simple to accomplish.

We're also proud of finishing our project since this is one of the first times that we have submitted a completed hackathon project.

## What we learned

This was our first time building a browser extension so that was extremely nice. The frameworks for browser extensions are extremely flexible and it was nice to get to use these.

We also learned how to make extremely functional and attractive user interfaces using Bulma CSS.

## What's next for Canvas Year in Review

Some useful features would include:

- Custom time periods to get a snapshot of
- The ability to include or exclude certain courses
- Sharing your year in review as an image on social media

## Icon Attribution

Note: the clock icon that we used for this extension is from [Font Awesome](https://fontawesome.com/icons/clock?style=solid) who licenses this icon under the [Creative Commons license](https://fontawesome.com/license).
