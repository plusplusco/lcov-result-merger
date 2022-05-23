/* eslint-env mocha */

const fs = require('vinyl-fs')
const File = require('vinyl')
const through = require('through2')
const chai = require('chai')
const lcovResultMerger = require('../index.js')

chai.should()

function collectFiles(stream) {
  return new Promise(function (resolve, reject) {
    const result = [];

    stream.on("data", function (file) {
      result.push(file);
    });

    stream.once("end", function () {
      resolve(result);
    });

    stream.once("error", function (error) {
      reject(error);
    });
  });
}

describe('lcovResultMerger', function () {
  it('should combine the given records into one', async function () {
    var expected = fs.src('./test/expected/basic/lcov.info')
    var actual = await collectFiles(fs.src('./test/fixtures/basic/*/lcov.info')
      .pipe(lcovResultMerger()))
    console.log(actual)
    return actual['lcov.info'].should.equal(expected)
  })

  it('should ignore null files', function (callback) {
    var stream = lcovResultMerger()
    stream.on('data', function (file) {
      file.contents.toString().should.equal('')
      callback()
    })
    stream.write(new File({
      path: '/meow.html',
      contents: null
    }))
    stream._flush()
  })

  it('should throw an error if streaming is attempted', function () {
    var stream = lcovResultMerger()
    void function () {
      stream.write(new File({
        path: '/foo.html',
        contents: through.obj()
      }))
    }.should.throw('Streaming not supported')
  })

  it('should handle a record with : in the name', function () {
    var expected = fs.src('./test/expected/windows/lcov.info')
    var actual = fs.src('./test/fixtures/windows/lcov.info')
      .pipe(lcovResultMerger())
    return actual.should.equal(expected)
  })

  it('should optionally prepend source file lines', function () {
    var expected = fs.src('./test/expected/prepended/lcov.info')
    var actual = fs.src('./test/fixtures/basic/*/lcov.info')
      .pipe(lcovResultMerger({ 'prepend-source-files': true }))
    return actual.should.equal(expected)
  })
})
