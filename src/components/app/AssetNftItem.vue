<template>
    <div :class="{ active }" class="collection">
        <div class="collection__header" @click="toggleCollapse">
            <AssetItem :item="formattedItem">
                <span class="nft-count">({{ item.nfts.length }})</span>
            </AssetItem>
            <ArrowIcon v-if="!hideContent" class="arrow" />
        </div>

        <div v-if="!hideContent" class="collection__content" :style="{ height: active ? '230px' : '0' }">
            <div class="collection__content-nfts">
                <div v-if="!selectedNft">
                    <Carousel ref="carousel" v-bind="settings" :breakpoints="breakpoints">
                        <Slide v-for="(nft, i) in item.nfts" :key="i">
                            <div class="collection__content-nfts-item" @click="selectedNft = nft">
                                <img :src="nft.avatar" v-if="nft.avatar" :alt="nft.name" @error="() => (nft.avatar = null)" />
                                <MaskIcon v-else class="avatar-placeholder"></MaskIcon>
                                <p>{{ nft.name }}</p>
                                <h5 v-if="nft.price">
                                    {{ formatNumber(nft.price, 2) }} <span> {{ nft.token.symbol }}</span>
                                </h5>
                            </div>
                        </Slide>
                    </Carousel>
                    <div class="navigation" v-if="item.nfts.length > 4">
                        <ArrowIcon class="navigation-arrow-prev" @click="prev" :class="{ disabled: currentSlideIndex < 1 }" />
                        <p>
                            <span>{{ currentSlideIndex + 1 }} - {{ currentSlideIndex + 4 }}</span> of {{ item.nfts.length }}
                        </p>
                        <ArrowIcon
                            class="navigation-arrow-next"
                            @click="next"
                            :class="{ disabled: currentSlideIndex >= item.nfts.length - 4 }"
                        />
                    </div>
                </div>

                <div v-else class="collection__content-info nft-details">
                    <div class="nft-details-title">
                        <ArrowIcon class="arrow-back" @click="hideNftInformation" />
                        <p class="nft-name">{{ selectedNft.name }}</p>
                    </div>
                    <div class="mt-10">
                        <p :class="{ activeOption: activeNftOption === 1 }" @click="activeNftOption = 1">
                            {{ $t('dashboard.details') }}
                        </p>
                        <p :class="{ activeOption: activeNftOption === 2, disabled: !selectedNft.description }" @click="showNftDescription">
                            {{ $t('dashboard.description') }}
                        </p>
                    </div>
                    <div v-if="activeNftOption === 1" class="collection__content-info-details">
                        <div>
                            <p>Token ID</p>
                            <div class="delimetr"></div>
                            <span>{{ selectedNft.tokenId }}</span>
                        </div>
                        <div>
                            <p>{{ $t('dashboard.ownerAddress') }}</p>
                            <div class="delimetr"></div>

                            <span>{{ cutAddress(selectedNft.ownerAddress) }}</span>
                            <CopyOutlined @click="copy(selectedNft.ownerAddress)" class="copy" />
                        </div>
                        <div v-if="selectedNft.url">
                            <p>URL</p>
                            <div class="delimetr"></div>
                            <a :href="selectedNft.url" target="_blank"
                                ><span>{{ cutAddress(selectedNft.url) }}</span> <LinkIcon class="link-icon"
                            /></a>
                        </div>
                    </div>
                    <div v-else class="collection__content-info-details">
                        <p class="description">{{ selectedNft.description }}</p>
                    </div>
                </div>
            </div>

            <div class="collection__content-info">
                <div>
                    <p :class="{ activeOption: activeOption === 1 }" @click="activeOption = 1">
                        {{ $t('dashboard.collectionInformation') }}
                    </p>
                    <p :class="{ activeOption: activeOption === 2, disabled: !item.description }" @click="showDescription">
                        {{ $t('dashboard.description') }}
                    </p>
                </div>
                <div v-if="activeOption === 1" class="collection__content-info-details">
                    <div>
                        <p>{{ $t('dashboard.floorPrice') }}</p>
                        <div class="delimetr"></div>
                        <h4>
                            {{ item.floorPrice || 0 }} <span>{{ item.token.symbol }}</span>
                        </h4>
                    </div>
                    <div>
                        <p>{{ $t('dashboard.volume') }}</p>
                        <div class="delimetr"></div>
                        <h4>
                            {{ item.volume || 0 }} <span>{{ item.token.symbol }}</span>
                        </h4>
                    </div>
                    <div>
                        <p>{{ $t('dashboard.marketCap') }}</p>
                        <div class="delimetr"></div>
                        <h4>
                            {{ item.marketCap || 0 }} <span>{{ item.token.symbol }}</span>
                        </h4>
                    </div>
                    <div>
                        <p>{{ $t('dashboard.numberOfItems') }}</p>
                        <div class="delimetr"></div>
                        <span>{{ item.numberOfAssets || '-' }}</span>
                    </div>
                    <div>
                        <p>{{ $t('dashboard.marketplaces') }}</p>
                        <div class="delimetr"></div>
                        <h4 class="name">{{ item.marketplaces[0]?.name }}</h4>
                    </div>
                    <div>
                        <p>{{ $t('dashboard.contractAddress') }}</p>
                        <div class="delimetr"></div>

                        <span>{{ cutAddress(item.address) }}</span>
                        <CopyOutlined @click="copy(item.address)" class="copy" />
                    </div>
                </div>
                <div v-else class="collection__content-info-details">
                    <h5 class="title">{{ item.name }}</h5>
                    <p class="description">{{ item.description }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { ref, computed } from 'vue';

import { useClipboard } from '@vueuse/core';

import { Carousel, Slide } from 'vue3-carousel';

import AssetItem from './AssetItem';
import { CopyOutlined } from '@ant-design/icons-vue';

import { cutAddress } from '@/helpers/utils';
import { formatNumber } from '@/helpers/prettyNumber';

import ArrowIcon from '@/assets/icons/dashboard/arrow.svg';
import LinkIcon from '@/assets/icons/dashboard/link.svg';
import MaskIcon from '@/assets/icons/dashboard/mask.svg';

import 'vue3-carousel/dist/carousel.css';

export default {
    name: 'AssetNftItem',
    components: {
        ArrowIcon,
        AssetItem,
        Carousel,
        Slide,
        CopyOutlined,
        LinkIcon,
        MaskIcon,
    },
    props: {
        item: {
            required: true,
            default: {},
        },
        hideContent: {
            required: false,
            default: false,
        },
    },
    setup(props) {
        const { copy } = useClipboard();

        const active = ref(false);
        const activeOption = ref(1);
        const activeNftOption = ref(1);
        const selectedNft = ref(null);
        const carousel = ref();
        const currentSlideIndex = ref(0);

        const settings = ref({
            itemsToShow: 4,
            snapAlign: 'start',
        });

        const breakpoints = ref({
            700: {
                itemsToShow: 2,
            },
            1024: {
                itemsToShow: 3,
            },
            1324: {
                itemsToShow: 4,
            },
            1764: {
                itemsToShow: 5,
            },
        });

        const next = () => {
            carousel.value.next();
            currentSlideIndex.value = carousel.value.data.currentSlide.value;
        };

        const prev = () => {
            carousel.value.prev();
            currentSlideIndex.value = carousel.value.data.currentSlide.value;
        };

        const formattedItem = computed(() => {
            return {
                ...props.item,
                balance: props.item.totalGroupBalance,
                balanceUsd: props.item.floorPriceUsd,
            };
        });

        const showDescription = () => {
            if (!props.item.description) {
                return;
            }
            activeOption.value = 2;
        };

        const hideNftInformation = () => {
            activeNftOption.value = 1;
            selectedNft.value = null;
        };

        const showNftDescription = () => {
            if (!selectedNft.value.description) {
                return;
            }
            activeNftOption.value = 2;
        };

        const toggleCollapse = () => {
            active.value = !active.value;
            selectedNft.value = null;
        };

        return {
            active,
            carousel,
            activeOption,
            currentSlideIndex,
            settings,
            selectedNft,
            breakpoints,
            activeNftOption,

            next,
            prev,
            copy,
            cutAddress,
            formattedItem,
            toggleCollapse,
            showDescription,
            showNftDescription,
            hideNftInformation,
            formatNumber,
        };
    },
};
</script>
<style lang="scss" scoped>
.collection {
    &__header {
        @include pageFlexRow;
        justify-content: space-between;
        cursor: pointer;
    }

    &:last-child .tokens__item {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
    }

    .mt-10 {
        margin-top: 10px;
    }
    svg.arrow {
        width: 2%;
        cursor: pointer;
        stroke: var(--#{$prefix}select-icon-color);
        transform: rotate(0);
        margin-top: -20px;
        @include animateEasy;
    }

    &.active {
        svg.arrow {
            transform: rotate(180deg);
            transition: 0.6s;
        }
    }
    .nft-count {
        margin-left: 6px;
        color: var(--#{$prefix}sub-text);
        font-weight: 500;
    }

    &__content {
        overflow: hidden;
        width: 100%;
        display: grid;
        grid-template-columns: 60% 38%;
        grid-gap: 10px;

        &-info {
            background-color: var(--#{$prefix}select-bg-color);
            border: 1px solid var(--#{$prefix}info-border-color);
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 20px;

            p {
                font-size: var(--#{$prefix}small-md-fs);
                color: var(--#{$prefix}base-text);
                font-weight: 400;
                display: inline;
                margin-right: 24px;
                cursor: pointer;
            }
            .activeOption {
                font-weight: 600;
                color: var(--#{$prefix}primary-text);
            }

            &-details {
                margin-top: 10px;
                overflow-x: hidden;
                overflow-y: scroll;
                height: 160px;
                width: 105%;
                padding-right: 10px;

                .title {
                    color: var(--#{$prefix}primary-text);
                    margin-bottom: 6px;
                    line-height: 16px;
                    font-size: var(--#{$prefix}small-lg-fs);
                }
                .description {
                    line-height: 16px;
                    font-size: var(--#{$prefix}small-md-fs);
                }
            }

            &-details > div {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                font-size: var(--#{$prefix}small-md-fs);
                height: 24px;

                a {
                    text-decoration: none;
                }
                p {
                    color: var(--#{$prefix}checkbox-text);
                    margin: 0;
                }

                h4,
                h5 {
                    color: var(--#{$prefix}primary-text);
                    font-weight: 600;
                }
                span {
                    font-weight: 400;
                    color: var(--#{$prefix}secondary-text);
                    margin-right: 3px;
                }

                .delimetr {
                    flex-grow: 1;
                    margin: 0 2px;
                    border-bottom: 1px dashed var(--#{$prefix}checkbox-text);
                }
                .name {
                    color: var(--#{$prefix}info);
                    font-weight: 400;
                    text-transform: capitalize;
                }
            }
        }

        .navigation {
            @include pageFlexRow;
            margin-top: 8px;
            justify-content: space-between;

            p {
                cursor: pointer;
                color: var(--#{$prefix}checkbox-text);
                font-size: var(--#{$prefix}small-sm-fs);

                span {
                    color: var(--#{$prefix}base-text);
                }
            }

            svg {
                cursor: pointer;
            }

            &-arrow-prev {
                transform: rotate(90deg);
            }

            &-arrow-next {
                transform: rotate(-90deg);
            }
        }
        &-nfts {
            overflow-x: auto;

            button {
                margin-top: 100px !important;
            }

            &-item {
                width: 130px;
                height: 180px;
                display: block;
                padding: 6px;
                font-size: var(--#{$prefix}small-sm-fs);
                line-height: 20px;
                border-radius: 8px;
                border: 1px solid var(--Geyser, #c9e0e0);
                cursor: pointer;

                img,
                .avatar-placeholder {
                    width: 116px;
                    height: 116px;
                    border-radius: 8px;
                }

                .avatar-placeholder {
                    fill: var(--#{$prefix}info-border-color);
                }

                p {
                    overflow: hidden;
                    text-wrap: nowrap;
                    text-overflow: ellipsis;
                    color: var(--#{$prefix}base-text);
                }

                h5 {
                    color: var(--#{$prefix}sub-text);
                    span {
                        color: var(--#{$prefix}base-text);
                        font-weight: 400;
                    }
                }
            }
        }
    }

    .nft-details {
        overflow: hidden;
        .collection__content-info-details {
            width: 103%;
            height: 128px;
        }

        &-title {
            @include pageFlexRow;
        }
        .nft-name {
            color: var(--#{$prefix}primary-text);
            font-weight: 500;
            font-size: var(--#{$prefix}small-lg-fs);
        }
    }
    .disabled {
        opacity: 0.5;
        cursor: default !important;
    }
    .copy {
        cursor: pointer;
        &:hover {
            color: $springGreen;
        }
    }

    .arrow-back {
        cursor: pointer;
        transform: rotate(90deg);
    }
    svg.link-icon {
        cursor: pointer;
        transform: scale(1.2);
    }
}
</style>
