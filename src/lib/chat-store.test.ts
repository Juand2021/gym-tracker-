import test from "node:test";
import assert from "node:assert/strict";
import {
  localAppendChatMessage,
  localCreateChatThread,
  localDeleteChatThread,
  localGetChatThread,
  localListChatThreads,
} from "./local-store.ts";

test("ChatStore: lifecycle of chat threads and messages", () => {
  const profileId = "juan";

  // 1. Create a thread
  const thread = localCreateChatThread(profileId, "Consulta de Hombro", {
    role: "user",
    content: "¿Cómo puedo mejorar el press militar?",
  });

  assert.ok(thread.id);
  assert.equal(thread.title, "Consulta de Hombro");
  assert.equal(thread.messages.length, 1);
  assert.equal(thread.messages[0].role, "user");
  assert.equal(thread.messages[0].content, "¿Cómo puedo mejorar el press militar?");

  // 2. Append assistant response
  const appended = localAppendChatMessage(profileId, thread.id, {
    role: "assistant",
    content: "Te recomiendo priorizar sobrecarga progresiva en rango de 6 a 8 repeticiones.",
  });

  assert.ok(appended);
  assert.equal(appended.thread.messages.length, 2);
  assert.equal(appended.thread.messages[1].role, "assistant");

  // 3. Multi-turn continuation: user follow up
  const followUp = localAppendChatMessage(profileId, thread.id, {
    role: "user",
    content: "Perfecto, ¿y qué accesorio me recomiendas?",
  });

  assert.ok(followUp);
  assert.equal(followUp.thread.messages.length, 3);

  // 4. Retrieve thread
  const retrieved = localGetChatThread(profileId, thread.id);
  assert.ok(retrieved);
  assert.equal(retrieved.id, thread.id);
  assert.equal(retrieved.messages.length, 3);

  // 5. List threads
  const list = localListChatThreads(profileId);
  const found = list.find((t) => t.id === thread.id);
  assert.ok(found);
  assert.equal(found.title, "Consulta de Hombro");
  assert.equal(found.messageCount, 3);

  // 6. Delete thread
  localDeleteChatThread(profileId, thread.id);
  const deleted = localGetChatThread(profileId, thread.id);
  assert.equal(deleted, null);
});
