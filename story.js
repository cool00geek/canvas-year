// Global variables, that should only be used for testing
domain = 'https://canvas.ucsc.edu';
// https://canvas.instructure.com/doc/api/file.oauth.html
token = "";

// Get all the classes you've taken
// Return: Array of course objects: https://canvas.instructure.com/doc/api/courses.html#method.courses.index
async function get_classes() {
    console.log(token);
    const response = await fetch(domain + "/api/v1/courses?" + new URLSearchParams({
        per_page: 50,
        include: ['total_scores']
    }), { headers: { Authorization: "Bearer" + token } })
    const stripped_resp = (await response.text()).substring(9);
    //console.log(stripped_resp);
    const json = await JSON.parse(stripped_resp);
    console.log(json);
    return json;
}

// Get the year of classes we want to analyze
// Return: int
function get_desired_year() {
    let currentTime = new Date();
    let year = currentTime.getFullYear();
    return year - 1;
}

/*
var assignment = {
    id: assignment_id_int,
    points_possible: total_number_of_points_double,
    due_at: time_due_date,

    late: is_late_bool,
    missing: is_missing_bool,
    score: score_double,
    submitted_at: time_submitted_date
};
*/
// Gets every assignment ID for the given course
// Should get points_possible, and due_at
// https://canvas.instructure.com/doc/api/assignments.html
// Return: Array of assignment object as defined above
async function get_assignments(course_name, course_id) {
    const response = await fetch(domain + "/api/v1/courses/" + course_id + "/assignments?per_page=100", { headers: { Authorization: "Bearer" + token } })
    const stripped_response = (await response.text()).substring(9);
    const assignment_arr = await JSON.parse(stripped_response);
    var assignments = [];
    for (var i = 0; i < assignment_arr.length; i++) {
        var assignment = assignment_arr[i];
        var assignment_id = assignment['id']
        var pts_possible = assignment['points_possible']
        var due_at_str = assignment['due_at']
        if (assignment_id != null) {
            var curr_assignment = {
                id: assignment_id,
                points_possible: pts_possible,
                due_at: due_at_str
            };
            var full_info = await get_submissions(course_id, curr_assignment);
            assignments.push(full_info);
        }
    }
    //console.log(assignments);
    return assignments;
}

// Get info about the user's submission to assignment_id
// https: //canvas.instructure.com/doc/api/submissions.html#method.submissions_api.show
// Should get the following info:
// - submitted_at (Time it was submitted)
// - late (boolean - late or not)
// - missing (will say whether it was submitted or not)
// - score (raw score as number)
// Updates the given assignment_details object, so the object has all the required data
// Return: assignment object
async function get_submissions(course_id, assignment_details) {
    const response = await fetch(domain + "/api/v1/courses/" + course_id + "/assignments/" + assignment_details['id'] + "/submissions/self", { headers: { Authorization: "Bearer" + token } })
    const stripped_response = (await response.text()).substring(9);
    const submission_arr = await JSON.parse(stripped_response);

    assignment_details['submitted_at'] = submission_arr['submitted_at'];
    assignment_details['late'] = submission_arr['late'];
    assignment_details['missing'] = submission_arr['missing'];
    assignment_details['score'] = submission_arr['score'];
    //console.log(assignment_details);
    return assignment_details;
}

/*
var class = {
    id: class_id_int,
    name: class code and name_string,
    score: score in class_double,
    grade: grade in class_string,
    assignments: array of assignments as defined above
};
*/
// Get the class ID and name for the classes we want to analyze
// Return an array of class objects as defined above
async function get_data() {
    var last_year = get_desired_year();
    var class_list = await get_classes();
    var classes = [];
    for (var i = 0; i < class_list.length; i++) {
        var curr_class = class_list[i];
        //console.log(curr_class);
        var start_at = curr_class['start_at']
        if (start_at != null) {
            var class_start_date = new Date(start_at);
            var year = class_start_date.getFullYear();
            if (year === last_year) {
                var class_name = curr_class['course_code'] + " - " + curr_class['name'];
                var class_id = curr_class['id'];
                var curr_score = curr_class['enrollments'][0]['computed_current_score'];
                var curr_grade = curr_class['enrollments'][0]['computed_current_grade'];
                //console.log(class_name + ": " + class_id + " " + curr_score + " " + curr_grade);
                var assignments = await get_assignments(class_name, class_id);
                var class_obj = {
                    id: class_id,
                    name: class_name,
                    score: curr_score,
                    grade: curr_grade,
                    assignments: assignments
                };
                classes.push(class_obj);
            }
        }
    }
    //console.log(classes);
    return classes;
}

/*
var parsed_data = {
    submitted: int,
    near_deadline: int,
    late: int,
    missing: int,
    assigned: int,
    avg_score: double,
    avg_class_score: double,
}
*/
// Parse the raw data to use it in the pretty UI part
// Return: Dictionary with the required info, as above
// TODO
async function parse_data() {
    console.log("Getting data...");
    var class_data = await get_data();
    console.log("Data acquired!");
    console.log(class_data);
    var parsed_data = {
        submitted: 0,
        near_deadline: 0,
        late: 0,
        missing: 0,
        assigned: 0,
        avg_score: 0.0,
        avg_class_score: 0.0,
    };
    // Helper vars to calculate average unweighted percent
    var total_points_received = 0;
    var total_points_possible = 0;
    // Helper vars to calculate average unweighted class score
    var total_class_points = 0;
    var total_classes = 0; // Not all classes give this info, so store it

    // Loop through every class
    for (var i = 0; i < class_data.length; i++) {
        // Update the helpers for the avg_class_score
        if (class_data[i]['score'] != null) {
            total_class_points += class_data[i]['score'];
            total_classes++;
        }
        // loop through every assignment
        for (var j = 0; j < class_data[i]['assignments'].length; j++) {
            var curr_assignment = class_data[i]['assignments'][j];
            // Increment assigned counter
            parsed_data['assigned']++;
            // If missing, increment that counter
            if (curr_assignment['missing']) {
                parsed_data['missing']++;
            } else if (curr_assignment['late']) {
                // If late, increment the respective counter
                // If it's late, we did end up submitting it
                parsed_data['late']++;
                parsed_data['submitted']++;
            } else {
                // If it's not late or missing then it was submitted on time
                parsed_data['submitted']++;
                // Check if the assignment was submitted <= 30 min of deadline
                if (curr_assignment['due_at'] != null && curr_assignment['submitted_at'] != null) {
                    //console.log("Due at: " + curr_assignment['due_at'] + "   Submitted: " + curr_assignment['submitted_at']);
                    var submission_time = new Date(curr_assignment['submitted_at']);
                    var due_time = new Date(curr_assignment['due_at']);
                    var diff = Math.abs(due_time - submission_time);
                    var minutes = Math.floor((diff / 1000) / 60);
                    if (minutes <= 30) {
                        parsed_data['near_deadline']++;
                    }
                    //console.log(minutes);
                }
            }
            // Add the percent of the current assignment to the helper
            var assignment_score = (curr_assignment['score'] / curr_assignment['points_possible']) * 100;
            //console.log("score: " + curr_assignment['score'] + "  possible: " + curr_assignment['points_possible']);
            if (!Number.isNaN(assignment_score) && Number.isFinite(assignment_score)) {
                //console.log("Is not nan");
                total_points_received += assignment_score;
                total_points_possible += 100;
                //console.log("Total pts received: " + total_points_received + "  total possible: " + total_points_possible);
            }
        }
    }

    // Compute average assignment score
    parsed_data['avg_score'] = total_points_received / total_points_possible * 100;
    // Compute average class score
    parsed_data['avg_class_score'] = total_class_points / total_classes;
    console.log(parsed_data);
    return parsed_data;
}

function clean_domain() {
    if (domain === "") {
        console.log("Domain was empty");
        domain = "https://canvas.ucsc.edu"
    }
    if (!domain.includes("https://")) {
        domain = "https://" + domain;
    }
    console.log(domain);
    if (domain.substr(-1) === '/') {
        console.log("The last character was a /");
        console.log(domain.substr(0, domain.length - 1));
    }
}

function set_data(data) {
    document.getElementById("assigned").innerHTML = data['assigned'];

    document.getElementById("submitted").innerHTML = data['submitted'];
    var submit_percent = data['submitted'] / data['assigned'] * 100;
    if (submit_percent > 90) {
        document.getElementById("submitted_box").classList.add("has-background-success");
    } else if (submit_percent > 80) {
        document.getElementById("submitted_box").classList.add("has-background-warning");
    } else {
        document.getElementById("submitted_box").classList.add("has-background-danger");
    }

    document.getElementById("near_d").innerHTML = data['near_deadline'];
    var near_d_percent = data['near_deadline'] / data['assigned'] * 100;
    if (near_d_percent < 10) {
        document.getElementById("near_d_box").classList.add("has-background-success");
    } else if (near_d_percent < 20) {
        document.getElementById("near_d_box").classList.add("has-background-warning");
    } else {
        document.getElementById("near_d_box").classList.add("has-background-danger");
    }

    document.getElementById("missing").innerHTML = data['missing'];
    var missing_percent = data['missing'] / data['assigned'] * 100;
    if (missing_percent < 5) {
        document.getElementById("missing_box").classList.add("has-background-success");
    } else if (missing_percent < 10) {
        document.getElementById("missing_box").classList.add("has-background-warning");
    } else {
        document.getElementById("missing_box").classList.add("has-background-danger");
    }

    document.getElementById("late").innerHTML = data['late'];
    var late_percent = data['late'] / data['assigned'] * 100;
    if (late_percent < 5) {
        document.getElementById("late_box").classList.add("has-background-success");
    } else if (late_percent < 10) {
        document.getElementById("late_box").classList.add("has-background-warning");
    } else {
        document.getElementById("late_box").classList.add("has-background-danger");
    }

    var score_percent = Math.round(data['avg_score'] * 100) / 100;
    document.getElementById("avg_score").innerHTML = score_percent + '%';
    if (score_percent >= 90) {
        document.getElementById("avg_score_box").classList.add("has-background-success");
    } else if (score_percent >= 70) {
        document.getElementById("avg_score_box").classList.add("has-background-warning");
    } else {
        document.getElementById("avg_score_box").classList.add("has-background-danger");
    }

    var class_score_percent = Math.round(data['avg_class_score'] * 100) / 100;
    document.getElementById("class_score").innerHTML = class_score_percent + '%';
    if (class_score_percent >= 90) {
        document.getElementById("class_score_box").classList.add("has-background-success");
    } else if (class_score_percent >= 70) {
        document.getElementById("class_score_box").classList.add("has-background-warning");
    } else {
        document.getElementById("class_score_box").classList.add("has-background-danger");
    }
}

async function update_popup() {
    domain = document.getElementById("domain_input").value
    clean_domain();

    document.getElementById("start_btn").classList.add("is-loading");

    const timer = ms => new Promise(res => setTimeout(res, ms));
    await timer(1 * 1000);

    var data = await parse_data();
    /*var data = {
        submitted: 30,
        near_deadline: 10,
        late: 0,
        missing: 5,
        assigned: 42,
        avg_score: 89.42,
        avg_class_score: 74.65,
    }*/
    set_data(data);

    document.getElementById("confirm_form").remove();
    document.getElementById("results").style.display = 'initial';

}

window.onload = function() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        chrome.browserAction.setIcon({
            path: {
                "32": "icons/icon32_light.png",
                "16": "icons/icon16_light.png"
            }
        });
    }
    document.getElementById("start_btn").onclick = function(event) { update_popup() };
};
//parse_data();