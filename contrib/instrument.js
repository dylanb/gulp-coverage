/*
 * Original code from https://github.com/itay/node-cover licensed under MIT did
 * not have a Copyright message in the file.
 *
 * Changes for the chain coverage instrumentation Copyright (C) 2014 Dylan Barrell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
var fs           = require('fs');
var esprima      = require('./esprima');
var escodegen    = require('./escodegen');
var EventEmitter = require('events').EventEmitter;

esprima.Syntax = {
    AssignmentExpression: 'AssignmentExpression',
    ArrayExpression: 'ArrayExpression',
    BlockStatement: 'BlockStatement',
    BinaryExpression: 'BinaryExpression',
    BreakStatement: 'BreakStatement',
    CallExpression: 'CallExpression',
    CatchClause: 'CatchClause',
    ConditionalExpression: 'ConditionalExpression',
    ContinueStatement: 'ContinueStatement',
    DoWhileStatement: 'DoWhileStatement',
    DebuggerStatement: 'DebuggerStatement',
    EmptyStatement: 'EmptyStatement',
    ExpressionStatement: 'ExpressionStatement',
    ForStatement: 'ForStatement',
    ForInStatement: 'ForInStatement',
    FunctionDeclaration: 'FunctionDeclaration',
    FunctionExpression: 'FunctionExpression',
    Identifier: 'Identifier',
    IfStatement: 'IfStatement',
    Literal: 'Literal',
    LabeledStatement: 'LabeledStatement',
    LogicalExpression: 'LogicalExpression',
    MemberExpression: 'MemberExpression',
    NewExpression: 'NewExpression',
    ObjectExpression: 'ObjectExpression',
    Program: 'Program',
    Property: 'Property',
    ReturnStatement: 'ReturnStatement',
    SequenceExpression: 'SequenceExpression',
    SwitchStatement: 'SwitchStatement',
    SwitchCase: 'SwitchCase',
    ThisExpression: 'ThisExpression',
    ThrowStatement: 'ThrowStatement',
    TryStatement: 'TryStatement',
    UnaryExpression: 'UnaryExpression',
    UpdateExpression: 'UpdateExpression',
    VariableDeclaration: 'VariableDeclaration',
    VariableDeclarator: 'VariableDeclarator',
    WhileStatement: 'WhileStatement',
    WithStatement: 'WithStatement'
};

module.exports = function(src) {
    var instrumentor = new Instrumentor(src);
    return instrumentor;
};

module.exports.Instrumentor = Instrumentor;

function Instrumentor(src) {
    // Setup our names
    this.names = {
        statement: this.generateName(6, "__statement_"),
        expression: this.generateName(6, "__expression_"),
        block: this.generateName(6, "__block_"),
        intro: this.generateName(6, "__intro_"),
        extro: this.generateName(6, "__extro_")
    };
    
    // Setup the node store
    this.nodes = {};
    
    // Setup the counters
    this.blockCounter = 0;
    this.nodeCounter = 0;
    
    if (src) {
        this.instrumentedSource = this.instrument(src);
    }
};

Instrumentor.prototype = new EventEmitter;

Instrumentor.prototype.objectify = function() {
    var obj = {};
    obj.blockCounter = this.blockCounter;
    obj.nodeCounter = this.nodeCounter;
    obj.source = this.source;
    
    obj.nodes = {};    
    for(var key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) {
            var node = this.nodes[key];
            obj.nodes[key] = { loc: node.loc, id: node.id };
        }
    }
    
    return obj;
}

Instrumentor.prototype.filter = function(action) {
    action = action || function() {};
    
    var filtered = [];
    for(var key in this.nodes) {
        if (this.nodes.hasOwnProperty(key)) {
            var node = this.nodes[key];
            if (action(node)) {
                filtered.push(node);
            }
        }
    }
    
    return filtered;
};

Instrumentor.prototype.instrument = function(code) {
    this.source = code;
    
    // Parse the code
    var tree = esprima.parse(code, {range: true, loc: true, comment: true});

    //console.log(JSON.stringify(tree, null, " "));
    var ignoredLines = {};
    var ignoreRe = /^\s*cover\s*:\s*false\s*$/;
    var ignoreBeginJSCRe = /^\s*#JSCOVERAGE_IF\s*$/;
    var ignoreEndJSCRe = /^\s*(#JSCOVERAGE_IF\s*0)|(#JSCOVERAGE_ENDIF)\s*$/;
    var begin, end, i, j;

    // Handle our ignore comment format
    tree.comments.
        filter(function(commentNode) {
            return ignoreRe.test(commentNode.value);
        }).
        forEach(function(commentNode) {
            ignoredLines[commentNode.loc.start.line] = true;
        });

    // Handle the JSCoverage ignore comment format
    var state = "end";
    var JSCComments = tree.comments.filter(function(commentNode) {
        return ignoreBeginJSCRe.test(commentNode.value) ||
            ignoreEndJSCRe.test(commentNode.value);
    }).map(function(commentNode) {
        if (ignoreBeginJSCRe.test(commentNode.value)) {
            return {
                type: "begin",
                node: commentNode
            };
        } else {
            return {
                type: "end",
                node: commentNode
            };
        }
    }).filter(function(item) {
        if (state === "end" && item.type === "begin") {
            state = "begin";
            return true;
        } else if (state === "begin" && item.type === "end") {
            state = "end";
            return true;
        }
        return false;
    });

    if (JSCComments.length && JSCComments[JSCComments.length - 1].type !== "end") {
        // The file ends with an open ignore. Need to estimate the file length
        // and add a synthetic node to the end of the array
        JSCComments.push({
            type: "end",
            node: {
                loc: {
                    start: {
                        line: code.split('\n').length
                    }
                }
            }
        });
    }

    for (i = 0; i < JSCComments.length; i += 2) {
        begin = JSCComments[i].node.loc.start.line;
        end = JSCComments[i + 1].node.loc.start.line;

        for (j = begin; j <= end; j++) {
            ignoredLines[j] = true;
        }
    }

    this.wrap(tree, ignoredLines);

    // We need to adjust the nodes for everything on the first line,
    // such that their location statements will start at 1 and not at header.length
    for(var nodeKey in this.nodes) {
        if (this.nodes.hasOwnProperty(nodeKey)) {
            var node = this.nodes[nodeKey];
            
            if (node.loc.start.line === 1 || node.loc.end.line === 1) {
                // Copy over the location data, as these are shared across
                // nodes. We only do it for things on the first line
                node.loc = {
                    start: {
                        line: node.loc.start.line,
                        column: node.loc.start.column
                    },
                    end: {
                        line: node.loc.end.line,
                        column: node.loc.end.column
                    }
                }   
                
                // Adjust the columns
                if (node.loc.start.line == 1) {
                    node.loc.start.column = node.loc.start.column;
                }
                if (node.loc.end.line == 1) {
                    node.loc.end.column = node.loc.end.column;
                }
            }
        }
    }
    
    return escodegen.generate(tree);
};

Instrumentor.prototype.addToContext = function(context) {
    context = context || {};
    
    var that = this;
    
    context[that.names.expression] = function (i) {
        var node = that.nodes[i];
        that.emit('node', node);
        
        return function (expr) {
            return expr;
        };
    };
    
    context[that.names.statement] = function (i) {
        var node = that.nodes[i];
        that.emit('node', node);
    };
    
    context[that.names.block] = function (i) {
        that.emit('block', i);
    };
    
    return context;
};

Instrumentor.prototype.generateName = function (len, prefix) {
    var name = '';
    var lower = '$'.charCodeAt(0);
    var upper = 'z'.charCodeAt(0);
    
    while (name.length < len) {
        var c = String.fromCharCode(Math.floor(
            Math.random() * (upper - lower + 1) + lower
        ));
        if ((name + c).match(/^[A-Za-z_$][A-Za-z0-9_$]*$/)) name += c;
    }
    
    return prefix + name;
};

Instrumentor.prototype.traverseAndWrap = function(object, visitor, master) {
    var key, child, parent, path;

    parent = (typeof master === 'undefined') ? [] : master;

    var returned = visitor.call(null, object, parent);
    if (returned === false) {
        return;
    }
    
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            path = [ object ];
            path.push(parent);
            var newNode;
            if (typeof child === 'object' && child !== null && !object.noCover) {
                newNode = this.traverseAndWrap(child, visitor, path);
            }
            
            if (newNode) {
                object[key] = newNode;
                newNode = null;
            }
        }
    }
    
    return object.noCover ? undefined : returned;
};

Instrumentor.prototype.wrap = function(tree, ignoredLines) {
    var that = this;
    this.traverseAndWrap(tree, function(node, path) {
        if (node.noCover) {
            return;
        }
        if (node.loc && node.loc.start.line in ignoredLines) {
            return false;
        }

        parent = path[0];
        switch(node.type) {
            case esprima.Syntax.ExpressionStatement:
            case esprima.Syntax.ThrowStatement:
            case esprima.Syntax.VariableDeclaration: {
                if (parent && (
                    (parent.type === esprima.Syntax.ForInStatement) ||
                    (parent.type === esprima.Syntax.ForStatement)
                    )) {
                    return;
                }
                
                var newNode = {
                    "type": "BlockStatement",
                    "body": [
                        {
                            "type": "ExpressionStatement",
                            "expression": {
                                "type": "CallExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": that.names.statement
                                },
                                "arguments": [
                                    {
                                        "type": "Literal",
                                        "value": that.nodeCounter++
                                    }
                                ]
                            }
                        },
                        node
                    ]
                }
                that.nodes[that.nodeCounter - 1] = node;
                node.id = that.nodeCounter - 1;
                
                return newNode;
            }
            case esprima.Syntax.ReturnStatement: {
                var newNode = {
                    "type": "SequenceExpression",
                    "expressions": [
                        {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": that.names.expression
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": that.nodeCounter++
                                }
                            ],
                            noCover: true
                        }
                    ],
                }
                
                if (node.argument) {
                    newNode.expressions.push(node.argument);
                }
                
                that.nodes[that.nodeCounter - 1] = node;
                node.id = that.nodeCounter - 1;
                
                node.argument = newNode
                break;
            }
            case esprima.Syntax.ConditionalExpression: {
                var newConsequentNode = {
                    "type": "SequenceExpression",
                    "expressions": [
                        {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": that.names.expression
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": that.nodeCounter++
                                }
                            ],
                            noCover: true
                        },
                        node.consequent
                    ],
                }
                that.nodes[that.nodeCounter - 1] = node.consequent;
                node.consequent.id = that.nodeCounter - 1
                
                var newAlternateNode = {
                    "type": "SequenceExpression",
                    "expressions": [
                        {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": that.names.expression
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": that.nodeCounter++
                                }
                            ],
                            noCover: true
                        },
                        node.alternate
                    ],
                }
                that.nodes[that.nodeCounter - 1] = node.alternate;
                node.alternate.id = that.nodeCounter - 1
                
                node.consequent = newConsequentNode;
                node.alternate = newAlternateNode;
                break;
            }
            case esprima.Syntax.CallExpression:
                if (node.callee.type === 'MemberExpression') {
                    var newNode = {
                        "type": "CallExpression",
                        "callee": {
                           "type": "Identifier",
                           "name": that.names.extro
                        },
                        "arguments": [
                           {
                              "type": "Identifier",
                              "name": that.nodeCounter
                           },
                           node
                        ]
                    },
                    intro = {
                        "type": "CallExpression",
                        "seen": true,
                        "callee": {
                           "type": "Identifier",
                           "name": that.names.intro
                        },
                        "arguments":[{
                              "type": "Identifier",
                              "name": that.nodeCounter++
                            },
                            node.callee.object
                        ]
                    };
                    node.callee.object = intro;
                    that.nodes[that.nodeCounter - 1] = node;
                    node.id = that.nodeCounter - 1;
                } else if (!node.seen) {
                    var newNode = {
                        "type": "SequenceExpression",
                        "expressions": [
                            {
                                "type": "CallExpression",
                                "callee": {
                                    "type": "Identifier",
                                    "name": that.names.expression
                                },
                                "arguments": [
                                    {
                                        "type": "Identifier",
                                        "name": that.nodeCounter++
                                    }
                                ]
                            },
                            node
                        ]
                    }
                    that.nodes[that.nodeCounter - 1] = node;
                    node.id = that.nodeCounter - 1;
                }                
                return newNode                
            case esprima.Syntax.BinaryExpression:
            case esprima.Syntax.UpdateExpression:
            case esprima.Syntax.LogicalExpression:
            case esprima.Syntax.UnaryExpression:
            case esprima.Syntax.Identifier: {
                // Only instrument Identifier in certain context.
                if (node.type === esprima.Syntax.Identifier) {
                    if (!(parent && (parent.type == 'UnaryExpression' ||
                          parent.type == 'BinaryExpression' ||
                          parent.type == 'LogicalExpression' ||
                          parent.type == 'ConditionalExpression' ||
                          parent.type == 'SwitchStatement' ||
                          parent.type == 'SwitchCase' ||
                          parent.type == 'ForStatement' ||
                          parent.type == 'IfStatement' ||
                          parent.type == 'WhileStatement' ||
                          parent.type == 'DoWhileStatement'))) {
                        return;
                    }
                    // Do not instrument Identifier when preceded by typeof
                    if (parent.operator == 'typeof') {
                        return;
                    }

                }
                var newNode = {
                    "type": "SequenceExpression",
                    "expressions": [
                        {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": that.names.expression
                            },
                            "arguments": [
                                {
                                    "type": "Identifier",
                                    "name": that.nodeCounter++
                                }
                            ]
                        },
                        node
                    ]
                }
                
                that.nodes[that.nodeCounter - 1] = node;
                node.id = that.nodeCounter - 1;
                
                return newNode
            }
            case esprima.Syntax.BlockStatement: {
                var newNode = {
                    "type": "ExpressionStatement",
                    "expression": {
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": that.names.block
                        },
                        "arguments": [
                            {
                                "type": "Literal",
                                "value": that.blockCounter++
                            }
                        ]
                    },
                    "noCover": true
                }
                
                node.body.unshift(newNode)
                break;
            }
            case esprima.Syntax.ForStatement:
            case esprima.Syntax.ForInStatement:
            case esprima.Syntax.LabeledStatement:
            case esprima.Syntax.WhileStatement:
            case esprima.Syntax.WithStatement:
            case esprima.Syntax.CatchClause:
            case esprima.Syntax.DoWhileStatement: {
                if (node.body && node.body.type !== esprima.Syntax.BlockStatement) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": [
                            node.body
                        ]
                    }
                    
                    node.body = newNode;
                }
                break;
            }
            case esprima.Syntax.TryStatement: {
                if (node.block && node.block.type !== esprima.Syntax.BlockStatement) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": [
                            node.block
                        ]
                    }
                    
                    node.block = newNode;
                }
                if (node.finalizer && node.finalizer.type !== esprima.Syntax.BlockStatement) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": [
                            node.block
                        ]
                    }
                    
                    node.finalizer = newNode;
                }
                break;
            }
            case esprima.Syntax.SwitchCase: {
                if (node.consequent && node.consequent.length > 0 &&
                    (node.consequent.length != 1 || node.consequent[0].type !== esprima.Syntax.BlockStatement)) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": node.consequent
                    }
                    
                    node.consequent = [newNode];
                }
                break;
            }
            case esprima.Syntax.IfStatement: {
                if (node.consequent && node.consequent.type !== esprima.Syntax.BlockStatement) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": [
                            node.consequent
                        ]
                    }
                    
                    node.consequent = newNode;
                }
                if (node.alternate && node.alternate.type !== esprima.Syntax.BlockStatement 
                    && node.alternate.type !== esprima.Syntax.IfStatement) {
                    var newNode = {
                        "type": "BlockStatement",
                        "body": [
                            node.alternate
                        ]
                    }
                    
                    node.alternate = newNode;
                }
                break;
            }
        }
    });
}
