"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");
const expect = chai.expect;
const { BlogPost } = require("../models");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

function seedBlogData() {
    const seedData = [];
    for(let i = 1; i <= 10; i++) {
        seedData.push(generateBlogData());
    }
    return BlogPost.insertMany(seedData);
}

function generateBlogData() {
    return {
        title: faker.hacker.phrase(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        content: faker.lorem.paragraphs(4, `<p>&nbsp;</p>`),
        created: faker.date.past()
    };
}

function tearDownDB() {
    return mongoose.connection.dropDatabase();
}

describe("API instructions", function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedBlogData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });


describe("GET endpoint test", function() {
    it("should return all blog posts", function() {
        let res;
        return chai
        .request(app)
        .get("/posts")
        .then(function(_res){
            res = _res;
            expect(res).to.have.status(200);
            expect(res.body.posts).to.have.lengthOf.at.least(1);
            return BlogPost.count();
        })
        .then(function(count) {
            expect(res.body.posts).to.have.lengthOf(count);
        });
    });

    it("should return posts with the correct fields", function() {
        let resPost;
        return chai
        .request(app)
        .get("/posts")
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body.posts).to.be.a("array");
            expect(res.body.posts).to.have.lengthOf.at.least(1);

            res.body.posts.array.forEach(function(post) {
                expect(post).to.be.a("object");
                expect(post).to.include.keys(
                    "title",
                    "author",
                    "content",
                    "created"
                );
            });
        resPost = res.body.posts[0];
        return BlogPost.findById(resPost.id)
        })
        .then(function(post) {
            expect(resPost.id).to.equal(post.id);
            expect(resPost.title).to.equal(post.title);
            expect(resPost.author).to.equal(post.author);
            expect(resPost.content).to.equal(post.content);
            expect(resPost.created).to.equal(post.created);    
        });
    });
});

describe("POST test", function() {
    it("should add a blog post to the database", function() {
        const newPost = generateBlogData();
        
        return chai
        .request(app)
        .post("/posts")
        .send(newPost)
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.a("object");
            expect(res.body).to.include.keys(
                "title",
                "author",
                "content",
                "created"
            );
            expect(res.body.title).to.equal(newPost.title);
            expect(res.body.author).to.equal(newPost.author);
            expect(res.body.content).to.equal(newPost.content);
            expect(res.body.created).to.equal(newPost.created);
            expect(res.body.id).to.not.be.null;
        });
    });
});

describe("PUT test", function() {
    it("should edit a post", function() {
        const upDatedData = {
        "title": "One Big Change to the Title"
        };

        return BlogPost.findOne()

        .then(function(post) {
           upDatedData.id = post.id;
        
        return chai
         .request(app)
         .put(`/posts/${post.id}`)
         .send(upDatedData)
        })

        .then(function(res) {
            expect(res).to.have.status(204);
        return BlogPost.findById(upDatedData.id);
        })

        .then(function(post) {
            expect(post.title).to.equal(upDatedData.title);
        });
    });
});

describe("DELETE test", function() {
    it("should delete a post from the database", function() {
        let post;
        return BlogPost.findOne()
        .then(function(_post) {
            post = _post;
            return chai
            .request(app)
            .delete(`/posts/${post.id}`);
        })
        .then(function(res) {
            expect(res).to.have.status(204);
            return BlogPost.findById(post.id);
        })
        .then(function(_post) {
            expect(_post).to.be.null;
        });
    });
});