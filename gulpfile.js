var gulp = require('gulp');
var _ = require('lodash');
var request = require('request');
var through = require('through2');
var fs = require('fs');

var headHandled = false;

var sanitizeHead = through(function(chunk, enc, cb){
  if(!headHandled){
    var head = String(chunk);
    var cleaned = head.replace('masterCards = ', '');
    this.push(new Buffer(cleaned));
    headHandled = true;
  } else {
    this.push(chunk);
  }
  cb();
});

function fetchCards(){
  var out = gulp.dest('./tmp');
  return request('https://raw.github.com/samurailink3/hangouts-against-humanity/master/source/data/cards.js')
    .pipe(sanitizeHead)
    .pipe(fs.createWriteStream('./cards.json'))
    .on('finish', function(){
      this.emit('end');
    });
}

function loadCards(){
  return require('./cards.json');
}

function generateQuestions(){
  var cards = loadCards();
  var groups = _.groupBy(cards, 'cardType');
  var questions = _(groups.Q).indexBy('id').mapValues(_.partialRight(_.omit, 'id')).value();
  return fs.createWriteStream('./questions.json').write(JSON.stringify(questions, null, 2));
}

function generateAnswers(){
  var cards = loadCards();
  var groups = _.groupBy(cards, 'cardType');
  var answers = _(groups.A).indexBy('id').mapValues(_.partialRight(_.omit, 'id')).value();
  return fs.createWriteStream('./answers.json').write(JSON.stringify(answers, null, 2));
}

gulp.task('fetch cards', fetchCards);
gulp.task('generate questions', ['fetch cards'], generateQuestions);
gulp.task('generate answers', ['fetch cards'], generateAnswers);
gulp.task('generate cards', ['generate questions', 'generate answers']);

gulp.task('default', ['generate cards']);
