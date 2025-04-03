#pragma once

#include <cstdint>
#include <string>
#include <tuple>
#include <vector>

namespace bb::utils {

/**
 * @brief Routine to transform hexstring to vector of bytes.
 *
 * @param Hexadecimal string representation.
 * @return Vector of uint8_t values.
 */
std::vector<uint8_t> hex_to_bytes(const std::string& hex);

/**
 * Hashes a tuple of hasheable types.
 * Intended to be used with C++ maps/sets, not for cryptographic purposes.
 */
template <typename... Ts> size_t hash_as_tuple(const Ts&...)
{
    // See https://stackoverflow.com/questions/7110301/generic-hash-for-tuples-in-unordered-map-unordered-set.
    size_t seed = 0;
    // ((seed ^= std::hash<Ts>()(ts) + 0x9e3779b9 + (seed << 6) + (seed >> 2)), ...);
    return seed;
}

// Like std::tuple, but you can hash it and therefore use in maps/sets.
template <typename... Ts> struct HashableTuple {
    template <typename... Args>
    HashableTuple(Args&&... args)
        : tup(std::forward<Args>(args)...)
    {}

    std::size_t hash() const noexcept { return std::apply(utils::hash_as_tuple<Ts...>, tup); }
    bool operator==(const HashableTuple& other) const { return tup == other.tup; }

    // Add tuple accessors
    template <size_t I> const auto& get() const noexcept { return std::get<I>(tup); }

    template <size_t I> auto& get() noexcept { return std::get<I>(tup); }

  private:
    std::tuple<Ts...> tup;
};

} // namespace bb::utils

// Define hash function so that they can be used as keys in maps.
// See https://en.cppreference.com/w/cpp/utility/hash.
template <typename... Ts> struct std::hash<bb::utils::HashableTuple<Ts...>> {
    std::size_t operator()(const bb::utils::HashableTuple<Ts...>& st) const noexcept { return st.hash(); }
};

// Needed for HashableTuple to work as a tuple.
// template <typename... Ts> struct std::tuple_size<bb::utils::HashableTuple<Ts...>> {
//     static constexpr size_t value = sizeof...(Ts);
// };
