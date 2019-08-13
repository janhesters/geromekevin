---
title: Query More Items Using Scans in AWS Amplify
date: '2019-06-18'
description: Use custom resolvers to create a Scan operation.
tags: ['amplify', 'api', 'graphql']
---

Is the [1000 item limit in AWS Amplify](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html#limits_appsync) hindering you from building your application? In this tutorial, you are going to learn how to use DynamoDB's Scan operation to query all items from a given table.

---

**Note:** This article is a tutorial for intermediates. Do you want to learn how to accelerate the creation of your projects using Amplify 🚀? For beginners, I recommend checking out [Nader Dabit](https://twitter.com/dabit3)'s [free course on egghead](https://egghead.io/courses/building-serverless-web-applications-with-react-aws-amplify), or Amplify's ['Getting Started'](https://aws-amplify.github.io/docs/js/start) to learn the basics.

When building Amplify applications, I found myself having to query for more than a thousand entities. You are going to learn how to create these large queries using custom resolvers. We are going to use a [Scan](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) operation.

If you are unfamiliar with the resources AWS Amplify generates when you run `amplify add api`, let me give you a brief overview. It produces tables for DynamoDB for each `@model` directive you use. It also generates resolvers that tell AppSync how given a GraphQL request it should read or write this data from/to DynamoDB. These resolvers are written in `.vtl` files and utilize the ["Apache Velocity Template Language"](https://velocity.apache.org/engine/1.7/user-guide.html). It looks like JSON with some logic.

The flaw with the resolvers that Amplify generates is that they are being filtered in the velocity templates. And `.vtl` files come with the restriction that for loops needn't exceed 1000 iterations. This is where the 1000 entity limit comes from. We are going to use a Scan operation and DynamoDB's build in filter method to circumvent this limit. Keep in mind that using this Scan the limit for the items queried is 1MB before filtering the results.

I'm going to walk you through the setup using a regular todo example. Feel free to code along.

Start by creating a new React app and adding Amplify.

```bash
npx create-react-app scantutorial && cd scantutorial && yarn add aws-amplify && amplify init
```

Consequently, add the API with authentication.

```bash
amplify add auth
```

Choose `Amazon Cognito User Pool` as your way of authentication and go with the simple todo schema. Push your changes using `amplify push`.

Next, modify your schema to reflect the following.

```graphql
type Todo @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  name: String!
  description: String
}

type Query {
  scanTodos: TodoResponse
}

type TodoResponse {
  items: [Todo]
}
```

We added authentication so we can filter items by owner. Furthermore, we added a new query called `scanTodos` that returns a nested attribute `items`, which is a list of `Todo`s.

We need to modify the `"Resources"` key in `amplify/api/<your-api-name>/stacks/CustomResources.json`.

```json
"Resources": {
    "EmptyResource": {
      "Type": "Custom::EmptyResource",
      "Condition": "AlwaysFalse"
    },
    "ScanTodosResolver": {
      "Type": "AWS::AppSync::Resolver",
      "Properties": {
        "ApiId": {
          "Ref": "AppSyncApiId"
        },
        "DataSourceName": "TodoTable",
        "TypeName": "Query",
        "FieldName": "scanTodos",
        "RequestMappingTemplateS3Location": {
          "Fn::Sub": [
            "s3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.scanTodos.req.vtl",
            {
              "S3DeploymentBucket": {
                "Ref": "S3DeploymentBucket"
              },
              "S3DeploymentRootKey": {
                "Ref": "S3DeploymentRootKey"
              }
            }
          ]
        },
        "ResponseMappingTemplateS3Location": {
          "Fn::Sub": [
            "s3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.scanTodos.res.vtl",
            {
              "S3DeploymentBucket": {
                "Ref": "S3DeploymentBucket"
              },
              "S3DeploymentRootKey": {
                "Ref": "S3DeploymentRootKey"
              }
            }
          ]
        }
      }
    }
},
```

We declared two resolver templates as new resources, one for the GraphQL request and one for the response. Let's write their respective templates. We start with the request (`amplify/api/<your-api-name>/resolvers/Query.scanTodos.req.vtl`).

```velocity
#set( $identityValue = $util.defaultIfNull($ctx.identity.claims.get("username"), $util.defaultIfNull($ctx.identity.claims.get("cognito:username"), "___xamznone____")) )
#set( $ScanRequest = {
"version": "2017-02-28",
  "operation": "Scan",
  "filter": {
    "expression": "#owner = :owner",
    "expressionValues": {
      ":owner": { "S": $identityValue }
    },
    "expressionNames": {
      "#owner": "owner"
    }
  }
} )
$util.toJson($ScanRequest)
```

This template is pretty easy to understand. We first get the user from the request. Next, we declare a new request that executes the `Scan` operation. And then we filter by owner. The `expression` is equals, and the value is the user we extracted earlier. Lastly, we need to give `owner` the alias `#owner` using `expressionNames` because the word "owner" is a [reserved word](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html#Expressions.ExpressionAttributeNames.ReservedWords) in DynamoDB.

The response template in `amplify/api/<your-api-name>/resolvers/Query.scanTodos.res.vtl` is straight forward.

```velocity
$util.toJson($ctx.result)
```

We merely return the result. Run `amplify push` to deploy your changes.

Now configure Amplify in `index.js`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Amplify from 'aws-amplify';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import config from './aws-exports';

Amplify.configure(config);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
```

Remember to create a user in the Cognito console. To conclude the example, we will render the todo count and create a thousand todos, if there are less than that.

```jsx
import React, { useEffect, useState } from 'react';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import './App.css';

import { scanTodos } from './graphql/queries';
import { createTodo } from './graphql/mutations';

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (x, i) => i + start);

function App() {
  const [todosCount, setTodosCount] = useState(0);

  useEffect(() => {
    async function loginAndCreateTodos() {
      try {
        await Auth.signIn('scan@tutorial.com', 'password');
        const todosData = await API.graphql(graphqlOperation(scanTodos));
        const count = todosData.data.scanTodos.items.length;
        setTodosCount(count);
        if (count < 1000) {
          console.log('Creating Todos ...');
          const dummyTodos = range(count, 1000).map(i => ({
            name: `Dummy${i}`,
          }));
          await asyncForEach(dummyTodos, async input => {
            await API.graphql(graphqlOperation(createTodo, { input }));
          });
          console.log('Done creating. Reload your app.');
        }
      } catch (error) {
        console.log(error);
      }
    }

    loginAndCreateTodos();
  }, []);

  return (
    <div className="App">
      <h4>Todo Count</h4>
      <p>{todosCount}</p>
    </div>
  );
}

export default App;
```

The code is pretty self-explanatory. `asyncForEach` avoids race conditions. `range` is a helper to fill an array with numbers between two bounds. And we have a `useEffect` that logs the user in, gets all todos using our `scanTodos` query and counts them. If there are less than a thousand, we create them. We also log in the console when the creation starts and when it ends so you know what's going on because creating a thousand todos can take a while.

Run the app, and after you see `"Done creating. Reload your app."` reload it. Your counter should now be at 1001. If it is you just did a query for more than a thousand entities 👏🏻. Good job! If you followed this tutorial, you can clear everything up by running `amplify delete`.

If you liked this article, you might also enjoy ["Creating GraphQL Batch Operations for AWS Amplify"](https://janhesters.com/creating-graphql-batch-operations-for-aws-amplify/) because we also use custom resolvers in it.
