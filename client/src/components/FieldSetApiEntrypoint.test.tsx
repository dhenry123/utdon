/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { Provider } from "react-redux";
import { screen } from "@testing-library/react";
import { FieldSetApiEntrypoint } from "./FieldSetApiEntrypoint";
import { store } from "../app/store";
import { renderWithIntl } from "../test/testUtils";

const renderEntrypoint = (props: {
  apiEntrypoint: string;
  method: string;
  commandTitle: string;
  body?: string;
  userAuthToken: string;
}) =>
  renderWithIntl(
    <Provider store={store}>
      <FieldSetApiEntrypoint {...props} />
    </Provider>
  );

describe("FieldSetApiEntrypoint", () => {
  it("builds the absolute url from the browser location", () => {
    const { container } = renderEntrypoint({
      apiEntrypoint: "/api/v1/action/compare/all/1",
      method: "PUT",
      commandTitle: "compare",
      userAuthToken: "",
    });
    expect(container.querySelector(".url")?.textContent).toMatch(
      /Url : http:\/\/localhost:\d+\/api\/v1\/action\/compare\/all\/1/
    );
  });

  it("curl command includes method, auth header and json body when provided", () => {
    renderEntrypoint({
      apiEntrypoint: "/api/v1/action/compare/all/1",
      method: "PUT",
      commandTitle: "compare",
      body: '{"uuid":"all"}',
      userAuthToken: "mytoken",
    });
    const command = screen.getByText(/curl -s/).textContent!;
    expect(command).toContain("-X PUT");
    expect(command).toContain('-H "Authorization: mytoken"');
    expect(command).toContain('-H "Content-Type: application/json"');
    expect(command).toContain(`--data '{"uuid":"all"}'`);
    expect(command).toMatch(/curl -s /);
  });

  it("GET without token nor body produces a bare curl", () => {
    renderEntrypoint({
      apiEntrypoint: "/api/v1/version",
      method: "GET",
      commandTitle: "version",
      userAuthToken: "",
    });
    const command = screen.getByText(/curl -s/).textContent!;
    expect(command).not.toContain("-X");
    expect(command).not.toContain("Authorization");
    expect(command).not.toContain("--data");
  });
});
