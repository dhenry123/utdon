# Creating a control - [Translated by deepl.com]

**Clarification in relation to healthchecks and immich**:
You'll see that the source code refers to the "healthchecks" and "immich" applications in the tests. Simply because I use these services as a basis for my work...
Please note that I have no direct or indirect links or interests with these applications or their authors. These projects are Opensource and available on the GitHub forge.

## Retrieving the production version

Give your control a name, the name of the application for example, and add the associated logo (PNG or JPEG format, max 100Kb).

The first difficulty is to retrieve the production version. How to retrieve this information may be indicated in the application documentation, but this is often not the case. Look for yourself... there's often an entrypoint api, like "[URL of the application]/version" or "[URL of the application]/api/v1/version"... which returns text or JSON format. The version can also be included in the login page. Depending on the type of response, you can either use the filters provided or create your own.
create your own.

### Filters (RegExp or JmesPath)

#### Text/Html/Xml (RegExp)

Example: the login page provides the desired information:

```html
<html>
  [..]
  <td>[....] Healthchecks v3.0.1</td>
</html>
```

Regexp will be : Healthchecks (v[\d+\.+]+)

Some teams start with the v1.0.1 model and suddenly, at the major, keep only 2 digits. Fortunately, Github exposes tags by date (DESC).

#### For JSON (JmesPath)

This is easier when developers provide an API entry point, which returns text that can be in json format.

In this case, simply provide the full path to the key, for example:

```json
{
  "version": "v3.0.1"
}
```

The Jmespath expression will be : 'version' ==> v3.0.1

Or :

```json
{
  "api": {
    "version": "v3.0.1"
  }
}
```

The Jmespath expression will be : 'api.version' ==> v3.0.1

Or :

```json
{ "major": 1, "minor": 89, "patch": 0 }
```

The Jmespath expression will be : 'join('.',\*)' ==> 1.89.0

## Retrieving the latest release from GitHub

I've simplified it: you paste the url of the application repository, the tool queries the github API for "release tags", then you apply the desired filter.

**WARNING**: The Github service applies a "rate-limit" policy to the use of its APIs. For the time being, this product has not been designed to authenticate to GITHUB APIs, so Github applies the most restrictive policy, i.e. and at this date: 60 calls per hour.

See the GitHub document :

- FR : https://docs.github.com/fr/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
- EN : https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28#get-rate-limit-status-for-the-authenticated-user

If this limit is applied by the GitHub service, the server logs will show this error :

```json
{"level":"error","message":{"errorToString":"Error: An error has occured: 403"
```

### Filters (RegExp)

Each team manages the version number as it sees fit. You need to analyze how they work to avoid "false positives". To do this, you can use existing filters or create your own with a regular expression.

Example: A project randomly uses this type of string: v1.0 (2digits) or v1.1.0 (3digits), the regular expression will be a generic expression allowing both cases to be considered:

- `v[0-9]+\.[0-9]`
- `v[0-9]+\.[0-9].[0-9]`

To simplify things and make sure you get a consistent result:

- `(v[\d+\.+]+)` : captures content beginning with v, followed by one or more digits and possibly a period. This captures: v2.0 et v1.9.12

### Follow only a version, (ex: LTS-Long Term Support)

The LTS version of a product is currently V2 "LTS", fix the expression by starting with the index "LTS": `(v2.[0-9]+\.+)`.

## Actions

These are add-ons for monitoring and triggering the CI/CD chain pipeline.

### Monitoring service (ping)

I personally use the "ping healthchecks" service. This type of service is generic and takes as url parameters: "0" for "OK" and "1" for "KO".

### CI/CD chain

This action is never called automatically; you need to request it using the API entrypoint or the button available after comparison. Generally, this action allows you to update your application by executing a pipeline of tasks. **Triggering this type of action automatically is bad practice**, as updating an application first requires reading the version documentation. There may be additional tasks to perform to the usual ones, which could take your application out of service.

Calls to UTDON APIs can be made in the CI/CD pipeline. The comparison entrypoint allows you to retrieve several pieces of information needed to build and/or deploy the update.

**WARNING**, if you use the associated container images, the authors may use a different tag naming method...

## Control recording

Control registration is necessary to perform the comparison. The server performs this operation.

## Comparison

Once the necessary information has been entered, you can start a comparison. The system returns the result:

- UPTODATE: nothing to do, your application is up to date
- UPTODATE with warning: This means that the application is up to date, but the comparison does not give a strict result. This is because there is a slight difference between the two results. The tool shows you why I consider the application to be up to date, but this may be a false positive...
- TOUPDATE: The application in production does not correspond at all to the latest version available on GitHuB.